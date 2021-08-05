/*
 * @Date: 2021-08-04 20:58:12
 * @LastEditors: Hwrn
 * @LastEditTime: 2021-08-05 10:34:18
 * @FilePath: /snakemarkdown/src/utils/utils.ts
 * @Description:
 */
import * as vscode from 'vscode';
import * as path from 'path';
import { CancellationToken, GlobPattern, Uri, workspace } from 'vscode';
import { sort as sortPaths } from 'cross-path-sort';
import * as fs from 'fs';

import { WorkspaceCache, RefT, FoundRefT, LinkRuleT } from '../types';


export const refPattern = '(\\[\\[)([^\\[\\]]+?)(\\]\\])';
export const imageExts = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];
const refRegexp = new RegExp(refPattern, 'gi');
const markdownExtRegex = /\.md$/i;
const imageExtsRegex = new RegExp(`.(${imageExts.join('|')})$`, 'i');
export const containsImageExt = (pathParam: string): boolean =>
  !!imageExtsRegex.exec(path.parse(pathParam).ext);
export const containsMarkdownExt = (pathParam: string): boolean =>
  !!markdownExtRegex.exec(path.parse(pathParam).ext);

export const isLongRef = (path: string) => path.split('/').length > 1;
export const normalizeSlashes = (value: string) => value.replace(/\\/gi, '/');

// init at cacheWorkspace
const workspaceCache: WorkspaceCache = {
    imageUris: [],
    markdownUris: [],
    allUris: [],
    danglingRefsByFsPath: {},
    danglingRefs: [],
};

export const getWorkspaceFolder = (): string | undefined =>
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.fsPath;

export const matchAll = (pattern: RegExp, text: string): Array<RegExpMatchArray> => {
  let match: RegExpMatchArray | null;
  const out: RegExpMatchArray[] = [];

  pattern.lastIndex = 0;

  while ((match = pattern.exec(text))) {
    out.push(match);
  }

  return out;
};

export const parseRef = (rawRef: string): RefT => {
  const escapedDividerPosition = rawRef.indexOf('\\|');
  const dividerPosition =
    escapedDividerPosition !== -1 ? escapedDividerPosition : rawRef.indexOf('|');

  return {
    ref: dividerPosition !== -1 ? rawRef.slice(0, dividerPosition) : rawRef,
    label:
      dividerPosition !== -1
        ? rawRef.slice(dividerPosition + (escapedDividerPosition !== -1 ? 2 : 1), rawRef.length)
        : '',
  };
};


export const cacheWorkspace = async () => {
    await cacheUris();
    // await cacheRefs();  cache [[]] in all files, should not be automatically
};
export const cacheUris = async () => {
    const markdownUris = await findNonIgnoredFiles('**/*.md');
    const imageUris = await findNonIgnoredFiles(`**/*.{${imageExts.join(',')}}`);
    const allUris = await findNonIgnoredFiles('');

    workspaceCache.markdownUris = sortPaths(markdownUris);
    workspaceCache.imageUris = sortPaths(imageUris);
    workspaceCache.allUris = sortPaths(allUris);
};

export function getConfigProperty<T>(property: string, fallback: T): T {
    return vscode.workspace.getConfiguration().get(property, fallback);
}

export const findNonIgnoredFiles = async (
    include: GlobPattern,
    excludeParam?: string | null,
    maxResults?: number,
    token?: CancellationToken,
): Promise<Uri[]> => {
    const exclude = [
        ...Object.keys(getConfigProperty('search.exclude', {})),
        ...Object.keys(getConfigProperty('file.exclude', {})),
        ...(typeof excludeParam === 'string' ? [excludeParam] : []),
    ].join(',');

    const files = await workspace.findFiles(include, `{${exclude}}`, maxResults, token);

    return files;
};

export function printFocusFile() {
    if (!!vscode.window.activeTextEditor) {
        const currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;
        const fileContent = fs.readFileSync(currentlyOpenTabfilePath, 'utf8').toString();

        fileContent.split(/\r?\n/g).forEach((lineText, lineNum) => {
            for (const match of matchAll(refRegexp, lineText)) {
                console.log(lineNum, lineText);
                const [, , reference] = match;
                if (reference) {
                    const offset = (match.index || 0) + 2;

                    const { ref } = parseRef(reference);

                    console.log(ref);
                    if (workspaceCache.allUris.find(uri => {
                        const relativeFsPath = path.sep + path.relative(getWorkspaceFolder()!.toLowerCase(), uri.fsPath.toLowerCase());

                        if (containsImageExt(ref)) {
                            if (isLongRef(ref)) {
                                const relativeFsPathNormalized = normalizeSlashes(relativeFsPath);
                                const refLowerCased = ref.toLowerCase();

                                return (
                                    relativeFsPathNormalized.endsWith(refLowerCased) ||
                                    relativeFsPathNormalized.endsWith(`${refLowerCased}.md`)
                                );
                            }
                            const basenameLowerCased = path.basename(uri.fsPath).toLowerCase();
                            return (
                                basenameLowerCased === ref.toLowerCase() || basenameLowerCased === `${ref.toLowerCase()}.md`
                            );
                        }
                        if (isLongRef(ref)) {
                            return normalizeSlashes(relativeFsPath).endsWith(`${ref.toLowerCase()}.md`);
                        }
                        const name = path.parse(uri.fsPath).name.toLowerCase();

                        return containsMarkdownExt(path.basename(uri.fsPath)) && name === ref.toLowerCase();
                    }, ref)) {
                        console.log(ref);
                    }
                }
            }
        });
    }

}
