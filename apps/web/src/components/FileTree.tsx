import { basename, parentPath, type VirtualFs } from "@terminal-invaders/core";

type Props = {
  fs: VirtualFs;
  cwd: string;
  activeFile?: string;
};

/** Render the virtual filesystem as a tree, highlighting cwd and the open file. */
export function FileTree({ fs, cwd, activeFile }: Props) {
  const roots = fs.allPaths().filter((p) => {
    const parent = parentPath(p);
    return parent === null || !fs.exists(parent);
  });

  return (
    <div className="panel filetree">
      <div className="panel-title">Files</div>
      <div className="tree-body">
        {roots.map((root) => (
          <Node key={root} fs={fs} path={root} depth={0} cwd={cwd} activeFile={activeFile} />
        ))}
      </div>
    </div>
  );
}

function Node({
  fs,
  path,
  depth,
  cwd,
  activeFile,
}: {
  fs: VirtualFs;
  path: string;
  depth: number;
  cwd: string;
  activeFile?: string;
}) {
  const isDir = fs.isDir(path);
  const name = basename(path);
  const classes = ["tree-row"];
  if (isDir && path === cwd) classes.push("is-cwd");
  if (!isDir && path === activeFile) classes.push("is-active");

  return (
    <>
      <div className={classes.join(" ")} style={{ paddingLeft: depth * 14 + 8 }}>
        <span className="tree-icon">{isDir ? "▸" : "·"}</span>
        {name}
        {isDir && path === cwd ? <span className="here">← here</span> : null}
      </div>
      {isDir
        ? fs.listDir(path).map((e) => (
            <Node key={e.path} fs={fs} path={e.path} depth={depth + 1} cwd={cwd} activeFile={activeFile} />
          ))
        : null}
    </>
  );
}
