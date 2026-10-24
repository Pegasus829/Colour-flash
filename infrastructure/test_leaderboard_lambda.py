import json
import pathlib
import py_compile
import re
import sys
import tempfile
import types
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "infrastructure" / "cloudformation.yaml"


def extract_lambda(text: str) -> str:
    marker = "ZipFile: |"
    start = text.index(marker)
    body = []
    for line in text[start:].splitlines()[1:]:
        if line.strip() == "":
            body.append("")
            continue
        if not line.startswith("          "):
            break
        body.append(line[10:])
    while body and body[-1] == "":
        body.pop()
    return "\n".join(body) + "\n"


def load_handler():
    exceptions = types.ModuleType("botocore.exceptions")

    class ClientError(Exception):
        def __init__(self, response, operation_name):
            super().__init__(operation_name)
            self.response = response

    exceptions.ClientError = ClientError
    botocore = types.ModuleType("botocore")
    botocore.exceptions = exceptions
    boto3 = types.ModuleType("boto3")
    boto3.resource = lambda *_args, **_kwargs: (_ for _ in ()).throw(RuntimeError("boto3"))
    sys.modules["botocore"] = botocore
    sys.modules["botocore.exceptions"] = exceptions
    sys.modules["boto3"] = boto3

    namespace = {"__name__": "leaderboard_lambda"}
    exec(extract_lambda(TEMPLATE.read_text()), namespace)
    return namespace, ClientError


class FakeTable:
    def __init__(self, client_error):
        self.items = {}
        self.puts = []
        self.queries = []
        self.gets = []
        self.client_error = client_error

    def get_item(self, Key, ConsistentRead=False):
        self.gets.append({"Key": Key, "ConsistentRead": ConsistentRead})
        item = self.items.get((Key["pk"], Key["sk"]))
        return {"Item": dict(item)} if item else {}

    def put_item(self, Item, ConditionExpression=None, ExpressionAttributeValues=None):
        self.puts.append(
            {
                "Item": dict(Item),
                "ConditionExpression": ConditionExpression,
                "ExpressionAttributeValues": dict(ExpressionAttributeValues),
            }
        )
        key = (Item["pk"], Item["sk"])
        existing = self.items.get(key)
        new_score = ExpressionAttributeValues[":score"]
        if existing is not None and not existing["score"] < new_score:
            raise self.client_error(
                {"Error": {"Code": "ConditionalCheckFailedException", "Message": "no"}},
                "PutItem",
            )
        self.items[key] = dict(Item)

    def query(self, **kwargs):
        self.queries.append(kwargs)
        pk = kwargs["ExpressionAttributeValues"][":pk"]
        rows = [dict(item) for item in self.items.values() if item.get("gsi1pk") == pk]
        rows.sort(key=lambda item: item["gsi1sk"], reverse=not kwargs.get("ScanIndexForward", True))
        return {"Items": rows[: kwargs["Limit"]]}


class LeaderboardLambdaTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ns, cls.client_error = load_handler()

    def setUp(self):
        self.table = FakeTable(self.client_error)
        self.ns["_TABLE"] = self.table

    def call(self, route, sub=None, body=None, query=None, name=None, raw_body=None):
        claims = {}
        if sub is not None:
            claims["sub"] = sub
        if name is not None:
            claims["name"] = name
        event = {
            "routeKey": route,
            "requestContext": {"authorizer": {"jwt": {"claims": claims}}},
        }
        if raw_body is not None:
            event["body"] = raw_body
        elif body is not None:
            event["body"] = json.dumps(body)
        if query is not None:
            event["queryStringParameters"] = query
        result = self.ns["handler"](event, None)
        return result["statusCode"], json.loads(result["body"])

    def test_inline_source_fits_cloudformation_limit(self):
        source = extract_lambda(TEMPLATE.read_text())
        self.assertLessEqual(len(source.encode()), 4096)
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "index.py"
            path.write_text(source)
            py_compile.compile(str(path), doraise=True)

    def test_write_uses_token_sub_and_rejects_a_lower_score(self):
        status, body = self.call(
            "POST /scores",
            sub="user-1",
            body={"score": 100, "level": 2, "playerName": "Ann", "pk": "USER#other", "sub": "other"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body, {"saved": True})
        item = self.table.items[("USER#user-1", "SCORE")]
        self.assertEqual(item["pk"], "USER#user-1")
        self.assertEqual(item["score"], 100)
        self.assertEqual(item["gsi1pk"], "LEADERBOARD")
        self.assertEqual(item["gsi1sk"], 100)
        self.assertNotIn(("USER#other", "SCORE"), self.table.items)
        self.assertIn("attribute_not_exists(pk) OR score < :score", self.table.puts[0]["ConditionExpression"])

        status, body = self.call(
            "POST /scores",
            sub="user-1",
            body={"score": 40, "level": 9, "playerName": "Bob"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body, {"saved": False})
        self.assertEqual(self.table.items[("USER#user-1", "SCORE")]["playerName"], "Ann")
        self.assertEqual(self.table.items[("USER#user-1", "SCORE")]["score"], 100)

        status, _body = self.call(
            "POST /scores",
            sub="user-1",
            body={"score": 250, "level": 4, "playerName": "Cara"},
        )
        self.assertEqual(status, 200)
        saved = self.table.items[("USER#user-1", "SCORE")]
        self.assertEqual(saved["score"], 250)
        self.assertEqual(saved["playerName"], "Cara")
        self.assertEqual(saved["level"], 4)
        self.assertEqual(len(self.table.items), 1)

    def test_rejects_scores_outside_the_cap(self):
        for score in (0, -5, 5000001, 1.5, True, "nope", None):
            status, body = self.call("POST /scores", sub="user-1", body={"score": score, "level": 1})
            self.assertEqual(status, 400, score)
            self.assertEqual(body["error"], "invalid score")
        self.assertEqual(self.table.items, {})

    def test_unauthenticated_write_does_not_touch_the_table(self):
        status, body = self.call("POST /scores", body={"score": 10, "level": 1, "playerName": "Ann"})
        self.assertEqual(status, 401)
        self.assertEqual(body["error"], "unauthorized")
        self.assertEqual(self.table.puts, [])

    def test_public_read_is_a_bounded_descending_query(self):
        for index in range(60):
            self.table.items[(f"USER#{index}", "SCORE")] = {
                "pk": f"USER#{index}",
                "sk": "SCORE",
                "playerName": f"P{index}",
                "score": index,
                "level": 1,
                "date": index,
                "gsi1pk": "LEADERBOARD",
                "gsi1sk": index,
            }
        status, body = self.call("GET /scores", query={"limit": "1000"})
        self.assertEqual(status, 200)
        self.assertEqual(len(body["scores"]), 50)
        self.assertEqual([row["score"] for row in body["scores"][:3]], [59, 58, 57])
        self.assertEqual(self.table.queries[0]["IndexName"], "LeaderboardIndex")
        self.assertFalse(self.table.queries[0]["ScanIndexForward"])
        self.assertEqual(self.table.queries[0]["Limit"], 50)
        for row in body["scores"]:
            self.assertEqual(set(row), {"playerName", "score", "level", "date"})

        status, body = self.call("GET /scores")
        self.assertEqual(len(body["scores"]), 10)

    def test_own_score_read_is_limited_to_the_caller(self):
        self.table.items[("USER#alice", "SCORE")] = {
            "pk": "USER#alice",
            "sk": "SCORE",
            "playerName": "Alice",
            "score": 20,
            "level": 3,
            "date": 5,
            "gsi1pk": "LEADERBOARD",
            "gsi1sk": 20,
        }
        self.table.items[("USER#bob", "SCORE")] = {
            "pk": "USER#bob",
            "sk": "SCORE",
            "playerName": "Bob",
            "score": 99,
            "level": 8,
            "date": 6,
            "gsi1pk": "LEADERBOARD",
            "gsi1sk": 99,
        }
        status, body = self.call("GET /scores/me", sub="alice")
        self.assertEqual(status, 200)
        self.assertEqual(body["playerName"], "Alice")
        self.assertEqual(body["score"], 20)
        self.assertNotIn("pk", body)
        self.assertTrue(self.table.gets[0]["ConsistentRead"])
        self.assertEqual(self.table.gets[0]["Key"], {"pk": "USER#alice", "sk": "SCORE"})

        status, body = self.call("GET /scores/me")
        self.assertEqual(status, 401)

    def test_display_name_is_trimmed(self):
        status, _body = self.call(
            "POST /scores",
            sub="user-1",
            name="Token Name",
            body={"score": 15, "level": 1, "playerName": "  <Ann>   Lee  " + ("x" * 40)},
        )
        self.assertEqual(status, 200)
        self.assertEqual(self.table.items[("USER#user-1", "SCORE")]["playerName"], "Ann Lee " + ("x" * 24))
        self.assertLessEqual(len(self.table.items[("USER#user-1", "SCORE")]["playerName"]), 32)


class SecurityTemplateTests(unittest.TestCase):
    def test_browser_roles_cannot_use_dynamodb(self):
        text = TEMPLATE.read_text()
        before_lambda_role = text.split("ScoresFunctionRole:", 1)[0]
        self.assertIn("AllowUnauthenticatedIdentities: false", before_lambda_role)
        self.assertNotIn("dynamodb:Scan", text)
        self.assertNotIn("dynamodb:PutItem", before_lambda_role)
        self.assertNotIn("dynamodb:Query", before_lambda_role)
        self.assertNotIn("dynamodb:GetItem", before_lambda_role)
        self.assertEqual(before_lambda_role.count("Action: dynamodb:*"), 2)
        self.assertIn("MinimumLength: 12", text)
        self.assertIn("RequireLowercase: true", text)
        self.assertIn("RequireUppercase: true", text)
        self.assertIn("RequireNumbers: true", text)
        self.assertIn("RequireSymbols: true", text)
        self.assertIn("AuthorizationType: NONE", text)
        self.assertEqual(text.count("AuthorizationType: JWT"), 2)

    def test_frontend_and_workflow(self):
        aws = (ROOT / "src" / "utils" / "aws.ts").read_text()
        storage = (ROOT / "src" / "utils" / "storage.ts").read_text()
        workflow = (ROOT / ".github" / "workflows" / "deploy.yml").read_text()
        package = json.loads((ROOT / "package.json").read_text())
        self.assertNotIn("@aws-sdk", aws)
        self.assertNotIn("ScanCommand", aws)
        self.assertNotIn("PutCommand", aws)
        self.assertIn("VITE_AWS_API_URL", aws)
        self.assertIn(";Secure", storage)
        self.assertNotIn("'Main'", workflow)
        self.assertNotIn('"Main"', workflow)
        uses = re.findall(r"uses: (\S+)", workflow)
        self.assertGreaterEqual(len(uses), 5)
        for action in uses:
            self.assertRegex(action, r"^[\w.-]+/[\w.-]+@[0-9a-f]{40}$")
        dependencies = package["dependencies"]
        self.assertNotIn("@aws-sdk/client-dynamodb", dependencies)
        self.assertNotIn("@aws-sdk/lib-dynamodb", dependencies)
        self.assertNotIn("@aws-sdk/credential-providers", dependencies)


if __name__ == "__main__":
    unittest.main()
