import { For } from 'solid-js';

interface INode {
  id: string;
  name: string;
  children: INode[];
}

interface ILeaf extends INode {
  href: string;
  children: [];
}

function isLeaf(node: INode): node is ILeaf {
  return node.children.length == 0;
}

export function createTree(files: string[]) {
  const tree = [] as INode[];

  for (const file of files) {
    let node = tree;
    let id = '';

    for (const part of file.split('/')) {
      let child = node.find((n) => n.name === part);

      if (!child) {
        child = {
          id: `${id}/${part}`,
          name: part,
          children: [],
        };
        node.push(child);
      }

      node = child.children;
      id += `/${part}`;
    }
  }

  return tree;
}

export function PrintTree(props: {
  class: string;
  root: INode[];
  depth?: number;
}) {
  const item = (node: INode) => <h3>{node.name}</h3>;
  const depth = () => props.depth || 0;

  return (
    <ul class={props.class}>
      <For each={props.root}>
        {(node) => (
          <li style={`--depth: ${depth()}`}>
            {isLeaf(node) ? (
              <a href={node.href}>{item(node)}</a>
            ) : (
              <details open={false}>
                <summary>{item(node)}</summary>
                <PrintTree
                  class={props.class}
                  root={node.children}
                  depth={depth() + 1}
                />
              </details>
            )}
          </li>
        )}
      </For>
    </ul>
  );
}
