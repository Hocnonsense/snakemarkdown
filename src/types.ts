import { Uri, Location } from 'vscode';

export type WorkspaceCache = {
  imageUris: Uri[];
  markdownUris: Uri[];
  allUris: Uri[];
  danglingRefs: string[];
  danglingRefsByFsPath: { [key: string]: string[] };
};

export type RefT = {
  label: string;
  ref: string;
};

export type FoundRefT = {
  location: Location;
  matchText: string;
};

export type LinkRuleT = {
  rule: string;
  comment?: string;
  folder: string;
};
