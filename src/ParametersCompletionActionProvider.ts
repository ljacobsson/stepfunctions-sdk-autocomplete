/* eslint-disable @typescript-eslint/naming-convention */
import { EOL } from "os";
import * as os from "os";
import * as vscode from "vscode";
import * as schemaUtil from "./utils/serviceSchemaUtil";
export class ParametersCompletionActionProvider
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
    if (currentLine.length > 1) {
      return null;
    }

    const [parent, paramNode] = ParametersCompletionActionProvider.getParent(
      document.getText(),
      position.line
    );

    const path = ParametersCompletionActionProvider.getParameterPath(
      document.getText(),
      position.line
    );
    if (!parent && !path) {
      return null;
    }
    const children = ParametersCompletionActionProvider.getChildren(
      document.getText(),
      parent
    );
    const enteredParams = ParametersCompletionActionProvider.getChildren(
      document.getText(),
      paramNode
    ).map((p) => p.split(":")[0]);
    const [service, action] =
      ParametersCompletionActionProvider.getService(children);

    const content = await schemaUtil.getServiceApi(service);
    const operation = content.operations[action];
    let parameters = operation.input?.members;
    if (path) {
      parameters = traverseParameters(path, parameters, content);
    }
    return this.completionItems(
      parameters,
      content.shapes,
      enteredParams,
      operation.input?.required || []
    );
  }

  public static getParameterPath(text: string, line: number) {
    const lines = text.split(EOL);
    const path = [];
    let currentLine = this.getLineAt(text, line, 0);
    let startSpaces = currentLine.spaces;
    do {
      line--;
      currentLine = this.getLineAt(text, line, 0);
      if (
        currentLine.spaces < startSpaces &&
        currentLine.text !== "Parameters:"
      ) {
        startSpaces = currentLine.spaces;
        path.push(currentLine.text.replace(":", "").replace("-", "").trim());
      }
    } while (currentLine.text !== "Parameters:" && line > 0);
    return path.filter((p) => p !== "").reverse();
  }

  private completionItems(
    parameters: any,
    shapes: any,
    enteredParams: string[],
    required: string[]
  ) {
    const completionItems: vscode.CompletionItem[] = [];
    for (const parameterName in parameters) {
      if (enteredParams.includes(parameterName)) {
        continue;
      }
      const parameter = parameters[parameterName];
      const label =
        parameterName + (required.includes(parameterName) ? " (required)" : "");
      if (parameter.shape) {
        const shape = shapes[parameter.shape];
        if (shape.type === "structure") {
          const completionItem = new vscode.CompletionItem(label);
          completionItem.insertText = `${parameterName}:${os.EOL}\t`;
          completionItem.kind = vscode.CompletionItemKind.Class;
          completionItem.detail = parameter.locationName;
          completionItems.push(completionItem);
        }
        if (shape.type === "list") {
          const completionItem = new vscode.CompletionItem(label);
          completionItem.insertText = `${parameterName}:${os.EOL}\t- `;
          completionItem.kind = vscode.CompletionItemKind.Enum;
          completionItem.detail = `List of ${parameter.locationName}`;
          completionItems.push(completionItem);
        }
        if (shape.type === "map") {
          const completionItem = new vscode.CompletionItem(label);
          completionItem.insertText = `${parameterName}:${os.EOL}\t`;
          completionItem.kind = vscode.CompletionItemKind.Constructor;
          completionItem.detail = `Map`;
          completionItems.push(completionItem);
        }
      } else {
        const completionItem = new vscode.CompletionItem(label);
        completionItem.kind = vscode.CompletionItemKind.Field;
        completionItem.detail = parameter.type || "string";
        completionItem.insertText = parameterName + ": ";
        completionItems.push(completionItem);
      }
    }
    return completionItems;
  }

  static upperCaseFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static getService(children: string[]): any {
    for (const child of children) {
      if (child.includes("Resource:")) {
        const arn = child.split(" ")[1].trim();
        const split = arn.split(":");
        const elements = split.length;
        return [
          split[elements - 2],
          ParametersCompletionActionProvider.upperCaseFirstLetter(
            split[elements - 1]
          ).split(".")[0],
        ];
      }
    }
  }

  static getChildren(text: string, parent: any) {
    return [
      ...ParametersCompletionActionProvider.scanChildren(text, parent, 1),
      ...ParametersCompletionActionProvider.scanChildren(text, parent, -1),
    ];
  }

  static scanChildren(text: string, parent: any, dir: number) {
    const children = [];
    const lines = text.split(EOL);
    let currentLine = parent;
    let startSpaces = parent.spaces;
    let line = parent.line;
    do {
      line = line + dir;
      currentLine = this.getLineAt(text, line, 0);
      children.push(currentLine.text);
    } while (currentLine.spaces >= startSpaces);
    console.log(children);
    return children;
  }
  static getParent(text: string, line: number) {
    let currentLine = this.getLineAt(text, line, 0);
    let startSpaces = currentLine.spaces;
    let inParameterNode = false;
    let paramNode = null;
    do {
      line--;
      currentLine = this.getLineAt(text, line, 0);
      if (currentLine.text === "Parameters:") {
        startSpaces = currentLine.spaces;
        inParameterNode = true;
        paramNode = currentLine;
        paramNode.line = line;
      }
    } while (line > 0 && !inParameterNode);
    if (!inParameterNode) {
      return [null, null];
    }
    currentLine.line = line;
    return [currentLine, paramNode];
  }

  static getLineAt(
    document: string,
    line: number,
    relativeDistance: number
  ): any {
    const lines = document.split(EOL);
    const match = lines[line]?.match(/^\s*/);
    const spaces = match ? match[0] : "";
    return {
      spaces: spaces?.length || 0,
      text: lines[line + relativeDistance].trim(),
    };
  }
}

function traverseParameters(
  path: any[],
  parameters: any,
  content: any,
  wasMap: boolean = false
) {
  for (const p of path) {
    if (parameters[p]) {
      const shape = content.shapes[parameters[p].shape];
      if (!shape && parameters[p].members) {
        parameters = parameters[p].members;
      } else if (shape.type === "structure") {
        parameters = shape.members;
      } else if (shape.type === "list") {
        parameters = traverseParameters(path, shape.member.members, content);
      } else if (shape.type === "map") {
        parameters = traverseParameters(
          path,
          shape.value.members,
          content,
          true
        );
      }
    }
  }
  return parameters;
}
// https://github.com/aws/aws-sdk-js/tree/master/apis
