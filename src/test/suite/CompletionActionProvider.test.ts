import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
//import * as vscode from "vscode";
import * as provider from "../../ParametersCompletionActionProvider";
import { ParametersCompletionActionProvider } from "../../ParametersCompletionActionProvider";

suite("Extension Test Suite", () => {
  //vscode.window.showInformationMessage("Start all tests.");

  test("Get parameter path", () => {
    const path = ParametersCompletionActionProvider.getParameterPath(
      `
      TestTask:
        Type: Task
        Parameters:
          Test: String
          Test2: 
            - Hej: 
                A: true

        Resource: arn:aws:states:::aws-sdk:lambda:invoke
      `,
      8
    );
    assert.notStrictEqual(path, ["Test2", "Hej"]);
  });
  test("Get parent", () => {
    const parent = ParametersCompletionActionProvider.getParent(
      `
      TestTask:
        Type: Task
        Parameters:
          Test: String
          Test2: 
            - Hej: 
                A: true
              
        Resource: arn:aws:states:::aws-sdk:lambda:invoke
      `,
      8
    );
    assert.strictEqual(parent, ["Test2", "Hej"]);
  });  
  
  test("Get service", () => {
    const parent = ParametersCompletionActionProvider.getService(
      ["a", "b", "arn:aws:states:::aws-sdk:dynamodb:putItem"]
    );
    assert.strictEqual(parent, ["Test2", "Hej"]);
  });
});
