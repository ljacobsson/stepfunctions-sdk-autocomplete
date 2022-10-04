import * as vscode from "vscode";
import { ParametersCompletionActionProvider } from "./ParametersCompletionActionProvider";
import { ResourceCompletionActionProvider } from "./ResourceCompletionActionProvider";

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      "yaml",
      new ParametersCompletionActionProvider(),
      ""
    ),
    vscode.languages.registerCompletionItemProvider(
      "yaml",
      new ResourceCompletionActionProvider(),
      ""
    )
  );
}

export function deactivate() {}
