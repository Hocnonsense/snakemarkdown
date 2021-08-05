import * as vscode from 'vscode';
import {
  extendMarkdownIt,
} from './features';

export const activate = async (
    context: vscode.ExtensionContext,
): Promise<void | { extendMarkdownIt: typeof extendMarkdownIt }> => {
    console.log('Your extension "snakemarkdown" is now active!');

    let disposable = vscode.commands.registerCommand("snakemarkdown.sayHello", () => {
        vscode.window.showInformationMessage("Hello World from snakeMarkdown!");
    });

    return {
        extendMarkdownIt
    };
};

// this method is called when your extension is deactivated
export function deactivate() {
    console.log('the extention is deactivated');

}
