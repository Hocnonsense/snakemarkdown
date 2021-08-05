import * as vscode from 'vscode';
import { printFocusFile } from '../utils';


const commands = [
  vscode.commands.registerCommand('snakemarkdown.printFocusFile', printFocusFile),
];

export default commands;
