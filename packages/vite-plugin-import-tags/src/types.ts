export interface ImportTagInfo {
  /**
   * The ID of the module that was transformed.
   * Typically a relative path to the file from the build directory.
   */
  src: string;
  /**
   * The path of the module being imported.
   */
  importPath: string;
}

export interface ImportTagsManifest {
  [md5Hash: string]: ImportTagInfo;
}
