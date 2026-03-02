import { useState } from 'react';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { listChildFolders } from '#onboarding/api/graphApi';
import type { FolderItem } from '#onboarding/types';

interface FolderNodeProps {
  item: FolderItem;
  token: string;
  selectedId: string | null;
  onSelect: (folder: FolderItem) => void;
  depth: number;
}

function FolderNode({ item, token, selectedId, onSelect, depth }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const isSelected = selectedId === item.id;
  const hasChildren = (item.childCount ?? 0) > 0;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expanded) {
      // Already loaded — just collapse.
      setExpanded(false);
      return;
    }
    if (!loaded) {
      // First expand: fetch children, then open.
      setLoading(true);
      try {
        const result = await listChildFolders(
          item.parentDriveId,
          item.id,
          item.parentSiteId,
          token,
        );
        setChildren(result);
        setLoaded(true);
      } catch {
        // Silently fail — the folder just won't expand.
      } finally {
        setLoading(false);
      }
    }
    setExpanded(true);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors select-none ${
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted text-foreground'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(item)}
      >
        {/* Expand toggle */}
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={hasChildren ? handleToggle : undefined}
          tabIndex={-1}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : hasChildren ? (
            expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )
          ) : (
            <span className="size-3.5 block" />
          )}
        </button>

        {expanded ? (
          <FolderOpen className="size-4 shrink-0 text-amber-500" />
        ) : (
          <Folder className="size-4 shrink-0 text-amber-500" />
        )}

        <span className="text-sm truncate flex-1">{item.name}</span>
      </div>

      {expanded && (
        <div>
          {children.length > 0 ? (
            children.map((child) => (
              <FolderNode
                key={child.id}
                item={child}
                token={token}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))
          ) : (
            <p
              className="text-xs text-muted-foreground py-1"
              style={{ paddingLeft: `${12 + (depth + 1) * 16 + 20}px` }}
            >
              No subfolders
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  rootFolders: FolderItem[];
  token: string;
  selectedId: string | null;
  onSelect: (folder: FolderItem) => void;
}

export function FolderTree({ rootFolders, token, selectedId, onSelect }: FolderTreeProps) {
  if (rootFolders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        This library has no folders. Select a different library or use the root.
      </p>
    );
  }

  return (
    <div className="space-y-0.5">
      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          item={folder}
          token={token}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}


interface DriveRootItemProps {
  driveId: string;
  driveName: string;
  siteId: string | null;
  token: string;
  selectedId: string | null;
  onSelect: (folder: FolderItem) => void;
}

/**
 * Renders a drive root as a selectable/expandable folder node.
 * Lazily loads root-level folders when expanded.
 */
export function DriveRootItem({
  driveId,
  driveName,
  siteId,
  token,
  selectedId,
  onSelect,
}: DriveRootItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Synthetic root item so the drive itself can be selected.
  const rootItem: FolderItem = {
    id: `drive-root:${driveId}`,
    name: driveName,
    webUrl: '',
    parentDriveId: driveId,
    parentSiteId: siteId,
    isRoot: true,
  };

  const isSelected = selectedId === rootItem.id;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (expanded) {
      // Already loaded — just collapse.
      setExpanded(false);
      return;
    }
    if (!loaded) {
      // First expand: fetch root folders, then open.
      setLoading(true);
      try {
        const { listDriveRootFolders } = await import('#onboarding/api/graphApi');
        const result = await listDriveRootFolders(driveId, siteId, token);
        setChildren(result);
        setLoaded(true);
      } catch {
        // Silently fail.
      } finally {
        setLoading(false);
      }
    }
    setExpanded(true);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors select-none ${
          isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
        }`}
        onClick={() => onSelect(rootItem)}
      >
        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={handleToggle}
          tabIndex={-1}
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : expanded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
        {expanded ? (
          <FolderOpen className="size-4 shrink-0 text-blue-500" />
        ) : (
          <Folder className="size-4 shrink-0 text-blue-500" />
        )}
        <span className="text-sm font-medium truncate flex-1">{driveName}</span>
      </div>

      {expanded && (
        <div>
          {children.length > 0 ? (
            children.map((child) => (
              <FolderNode
                key={child.id}
                item={child}
                token={token}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={1}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-1 pl-10">
              No subfolders
            </p>
          )}
        </div>
      )}
    </div>
  );
}

