/**
 * RichTextEditor — editor WYSIWYG basado en TipTap.
 *
 * Soporta: títulos H1/H2/H3, negrita, cursiva, listas (con/sin viñetas),
 * enlaces, saltos de línea, párrafos.
 *
 * Guarda HTML como string. Se renderiza después con un sanitizer mínimo
 * (RichTextView component) para evitar inyección de scripts.
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading1, Heading2, Heading3,
  Undo, Redo, Quote, Code,
} from "lucide-react";
import { useEffect } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 hover:text-primary/80",
          rel: "noreferrer",
          target: "_blank",
        },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[280px] max-h-[60vh] overflow-y-auto rounded-b-lg border-x border-b border-input bg-white px-4 py-3 text-sm leading-relaxed text-foreground focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // TipTap devuelve <p></p> cuando está vacío — normalizamos a string vacío
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sincronizar contenido si cambia externamente (ej: al cargar el curso)
  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const normalized = currentHtml === "<p></p>" ? "" : currentHtml;
    if ((value || "") !== normalized) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const tb = "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors";
  const tbActive = "bg-primary/15 text-primary";
  const tbIdle = "text-foreground/70 hover:bg-secondary";

  const promptLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace (dejá vacío para quitar):", prev ?? "https://");
    if (url === null) return; // cancelado
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="rounded-lg shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-t-lg border border-input bg-secondary/40 px-2 py-1.5">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1" className={`${tb} ${editor.isActive("heading", { level: 1 }) ? tbActive : tbIdle}`}>
          <Heading1 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2" className={`${tb} ${editor.isActive("heading", { level: 2 }) ? tbActive : tbIdle}`}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3" className={`${tb} ${editor.isActive("heading", { level: 3 }) ? tbActive : tbIdle}`}>
          <Heading3 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} title="Negrita (Ctrl+B)" className={`${tb} ${editor.isActive("bold") ? tbActive : tbIdle}`}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} title="Cursiva (Ctrl+I)" className={`${tb} ${editor.isActive("italic") ? tbActive : tbIdle}`}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCode().run()} title="Código en línea" className={`${tb} ${editor.isActive("code") ? tbActive : tbIdle}`}>
          <Code className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista con viñetas" className={`${tb} ${editor.isActive("bulletList") ? tbActive : tbIdle}`}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada" className={`${tb} ${editor.isActive("orderedList") ? tbActive : tbIdle}`}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Cita" className={`${tb} ${editor.isActive("blockquote") ? tbActive : tbIdle}`}>
          <Quote className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-border" />

        <button type="button" onClick={promptLink} title="Insertar/editar enlace" className={`${tb} ${editor.isActive("link") ? tbActive : tbIdle}`}>
          <LinkIcon className="h-4 w-4" />
        </button>

        <span className="mx-1 ml-auto h-5 w-px bg-border" />

        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Deshacer (Ctrl+Z)" className={`${tb} ${tbIdle} disabled:opacity-30`}>
          <Undo className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Rehacer (Ctrl+Y)" className={`${tb} ${tbIdle} disabled:opacity-30`}>
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      {!value && placeholder && (
        <p className="pointer-events-none mt-1 px-1 text-[11px] text-muted-foreground">{placeholder}</p>
      )}
    </div>
  );
}

/**
 * RichTextView — renderiza HTML guardado por RichTextEditor de forma segura.
 * Sanitiza eliminando tags peligrosos (script, iframe, on* attrs) antes de
 * insertar con dangerouslySetInnerHTML.
 */
export function RichTextView({ html, className = "" }: { html: string; className?: string }) {
  const safe = sanitizeHtml(html || "");
  return (
    <div
      className={"rich-text-content " + className}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

// Sanitizer mínimo — quita scripts, iframes, event handlers, javascript: urls.
// Para teoría escrita por admin (no por user externo) es suficiente como
// defensa en profundidad. Las apps con mayor superficie deberían usar DOMPurify.
function sanitizeHtml(html: string): string {
  if (typeof document === "undefined") return html;
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const root = tpl.content;

  const walk = (node: Element) => {
    const tag = node.tagName?.toLowerCase();
    if (tag === "script" || tag === "iframe" || tag === "object" || tag === "embed" || tag === "style") {
      node.remove();
      return;
    }
    // Quitar atributos peligrosos
    const attrs = Array.from(node.attributes ?? []);
    for (const a of attrs) {
      const name = a.name.toLowerCase();
      if (name.startsWith("on")) node.removeAttribute(a.name);
      if ((name === "href" || name === "src") && /^\s*javascript:/i.test(a.value)) {
        node.removeAttribute(a.name);
      }
    }
    // Recorrer hijos (copia para no romper iteración al remover)
    Array.from(node.children).forEach(walk);
  };
  Array.from(root.children).forEach(walk);
  return tpl.innerHTML;
}
