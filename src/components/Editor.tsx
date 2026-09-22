"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import Mention from "@tiptap/extension-mention";
import type { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react";
import { savePageContent } from "@/app/actions";

const PEOPLE = ["Ej", "Chris"];

/* ---------- @mention dropdown ---------- */
type MentionListRef = { onKeyDown: (p: SuggestionKeyDownProps) => boolean };
const MentionList = forwardRef<MentionListRef, SuggestionProps<string>>(function MentionList({ items, command }, ref) {
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [items]);
  const select = (i: number) => { const item = items[i]; if (item) command({ id: item, label: item }); };
  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") { setIdx((i) => (i + items.length - 1) % items.length); return true; }
      if (event.key === "ArrowDown") { setIdx((i) => (i + 1) % items.length); return true; }
      if (event.key === "Enter") { select(idx); return true; }
      return false;
    },
  }));
  if (!items.length) return null;
  return <div className="mention-menu">{items.map((it, i) => <button key={it} className={i === idx ? "on" : ""} onClick={() => select(i)}>@{it}</button>)}</div>;
});

function mentionSuggestion() {
  return {
    items: ({ query }: { query: string }) => PEOPLE.filter((p) => p.toLowerCase().startsWith(query.toLowerCase())),
    render: () => {
      let component: ReactRenderer<MentionListRef, SuggestionProps<string>> | null = null;
      let el: HTMLDivElement | null = null;
      const place = (props: SuggestionProps<string>) => {
        const rect = props.clientRect?.();
        if (!rect || !el) return;
        el.style.left = `${rect.left + window.scrollX}px`;
        el.style.top = `${rect.bottom + window.scrollY + 4}px`;
      };
      return {
        onStart: (props: SuggestionProps<string>) => {
          component = new ReactRenderer(MentionList, { props, editor: props.editor });
          el = document.createElement("div");
          el.style.position = "absolute"; el.style.zIndex = "50";
          el.appendChild(component.element);
          document.body.appendChild(el);
          place(props);
        },
        onUpdate: (props: SuggestionProps<string>) => { component?.updateProps(props); place(props); },
        onKeyDown: (props: SuggestionKeyDownProps) => { if (props.event.key === "Escape") { el?.remove(); return true; } return component?.ref?.onKeyDown(props) ?? false; },
        onExit: () => { el?.remove(); component?.destroy(); el = null; component = null; },
      };
    },
  };
}

/* ---------- editor ---------- */
export default function Editor({ pageId, initial, placeholder = "Write anything. Type / for nothing — this isn't Notion — but @ mentions, tables, checklists and links all work." }: { pageId: string; initial: unknown; placeholder?: string }) {
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener", target: "_blank" } } }),
      Placeholder.configure({ placeholder }),
      TaskList, TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell,
      Mention.configure({ HTMLAttributes: { class: "mention" }, suggestion: mentionSuggestion(), renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}` }),
    ],
    content: (initial as object) || { type: "doc", content: [] },
    editorProps: { attributes: { class: "editor" } },
    onUpdate: ({ editor }) => {
      setSaved("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try { await savePageContent(pageId, editor.getJSON()); setSaved("saved"); } catch { setSaved("error"); }
      }, 700);
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().extendMarkRange("link").unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return <div className="editor text-muted">Loading editor…</div>;
  const B = ({ on, run, children, title }: { on?: boolean; run: () => void; children: React.ReactNode; title: string }) => (
    <button type="button" title={title} className={on ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); run(); }}>{children}</button>
  );
  const c = editor.chain().focus();

  return (
    <div className="space-y-3">
      <div className="toolbar">
        <B title="Heading 1" on={editor.isActive("heading", { level: 1 })} run={() => c.toggleHeading({ level: 1 }).run()}>H1</B>
        <B title="Heading 2" on={editor.isActive("heading", { level: 2 })} run={() => c.toggleHeading({ level: 2 }).run()}>H2</B>
        <B title="Heading 3" on={editor.isActive("heading", { level: 3 })} run={() => c.toggleHeading({ level: 3 }).run()}>H3</B>
        <span className="sep" />
        <B title="Bold" on={editor.isActive("bold")} run={() => c.toggleBold().run()}><b>B</b></B>
        <B title="Italic" on={editor.isActive("italic")} run={() => c.toggleItalic().run()}><i>I</i></B>
        <B title="Strike" on={editor.isActive("strike")} run={() => c.toggleStrike().run()}><s>S</s></B>
        <B title="Code" on={editor.isActive("code")} run={() => c.toggleCode().run()}>{"</>"}</B>
        <B title="Link" on={editor.isActive("link")} run={setLink}>Link</B>
        <span className="sep" />
        <B title="Bullet list" on={editor.isActive("bulletList")} run={() => c.toggleBulletList().run()}>• List</B>
        <B title="Numbered list" on={editor.isActive("orderedList")} run={() => c.toggleOrderedList().run()}>1. List</B>
        <B title="Checklist" on={editor.isActive("taskList")} run={() => c.toggleTaskList().run()}>☐ Todo</B>
        <B title="Quote" on={editor.isActive("blockquote")} run={() => c.toggleBlockquote().run()}>Quote</B>
        <B title="Code block" on={editor.isActive("codeBlock")} run={() => c.toggleCodeBlock().run()}>Code</B>
        <B title="Divider" run={() => c.setHorizontalRule().run()}>—</B>
        <span className="sep" />
        <B title="Insert table" run={() => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Table</B>
        {editor.isActive("table") && (<>
          <B title="Add column" run={() => c.addColumnAfter().run()}>+Col</B>
          <B title="Add row" run={() => c.addRowAfter().run()}>+Row</B>
          <B title="Delete column" run={() => c.deleteColumn().run()}>−Col</B>
          <B title="Delete row" run={() => c.deleteRow().run()}>−Row</B>
          <B title="Delete table" run={() => c.deleteTable().run()}>✕ Table</B>
        </>)}
        <span className="ml-auto self-center pr-2 text-[11.5px] text-muted">
          {saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : saved === "error" ? <span className="text-crit">Not saved — check connection</span> : "@Ej / @Chris to mention"}
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
