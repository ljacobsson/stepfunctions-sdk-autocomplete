/* eslint-disable @typescript-eslint/naming-convention */
import { EOL } from "os";
import * as os from "os";
import * as vscode from "vscode";
import * as schemaUtil from "./utils/serviceSchemaUtil";
export class ResourceCompletionActionProvider
  implements vscode.CompletionItemProvider
{
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<
    | vscode.CompletionItem[]
    | vscode.CompletionList<vscode.CompletionItem>
    | null
    | undefined
  > {
    const currentLine = document.lineAt(position.line).text.trim();
    if (currentLine.startsWith("Resource: ") && currentLine.endsWith(":")) {
      const service = currentLine.split(":").slice(-2)[0].trim();
      const serviceApi = await schemaUtil.getServiceApi(service);
      const ops = Object.keys(serviceApi.operations);
      return ops.map((op) => {
        const completionItem = new vscode.CompletionItem(
          op,
          vscode.CompletionItemKind.Function
        );
        completionItem.insertText = this.lowerCaseFirstLetter(op);
        return completionItem;
      });
    }
    return null;
  }

  private lowerCaseFirstLetter(string: string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }
}
