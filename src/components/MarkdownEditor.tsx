import { useRef, useState, type ClipboardEvent, type DragEvent } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { imagesEnabled, uploadImage } from '../lib/upload'
import { Icon, inp, useC } from '../ui'

export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const C = useC()
  const ta = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const insert = (text: string, wrap?: [string, string]) => {
    const el = ta.current
    if (!el) {
      onChange(value + text)
      return
    }
    const start = el.selectionStart
    const end = el.selectionEnd
    const sel = value.slice(start, end)
    let piece = text
    let caret = start + text.length
    if (wrap) {
      piece = wrap[0] + (sel || text) + wrap[1]
      caret = start + (sel ? piece.length : wrap[0].length + text.length)
    }
    onChange(value.slice(0, start) + piece + value.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const prefixLines = (prefix: string) => {
    const el = ta.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const block = value.slice(lineStart, end)
    const next = block
      .split('\n')
      .map((l) => prefix + l)
      .join('\n')
    onChange(value.slice(0, lineStart) + next + value.slice(end))
    requestAnimationFrame(() => el.focus())
  }

  const doUpload = async (file: File) => {
    setError(null)
    setUploading(true)
    try {
      const url = await uploadImage(file)
      insert(`\n![imagen](${url})\n`)
      setTab('write')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen.')
    } finally {
      setUploading(false)
    }
  }

  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items || [])
    const item = items.find((i) => i.kind === 'file' && i.type.startsWith('image/'))
    const file = item?.getAsFile()
    if (file) {
      e.preventDefault()
      void doUpload(file)
    }
  }

  const onDrop = (e: DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer?.files || []).find((f) => f.type.startsWith('image/'))
    if (file) void doUpload(file)
  }

  const pickImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) void doUpload(file)
    }
    input.click()
  }

  const tool = (icon: string, title: string, onClick: () => void, disabled?: boolean) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{ width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center', color: C.muted, opacity: disabled ? 0.4 : 1 }}
    >
      <Icon name={icon} size={17} color={C.muted} />
    </button>
  )

  const components: Components = {
    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" style={{ color: C.primary }} />,
    img: ({ node, ...props }) => <img {...props} alt={props.alt || 'imagen'} />,
  }

  return (
    <div style={{ border: '1px solid ' + (dragOver ? C.primary : C.line2), borderRadius: '11px', background: C.card2, overflow: 'hidden' }}>
      {/* toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', padding: '4px 6px', borderBottom: '1px solid ' + C.line, flexWrap: 'wrap' }}>
        {tab === 'write' ? (
          <>
            {tool('format_bold', 'Negrita', () => insert('texto', ['**', '**']))}
            {tool('format_italic', 'Cursiva', () => insert('texto', ['*', '*']))}
            {tool('title', 'Título', () => prefixLines('## '))}
            {tool('format_list_bulleted', 'Lista', () => prefixLines('- '))}
            {tool('checklist', 'Checklist', () => prefixLines('- [ ] '))}
            {tool('link', 'Enlace', () => insert('[texto](https://)'))}
            {tool('image', imagesEnabled() ? 'Subir imagen' : 'Configura el almacenamiento de imágenes para subirlas', pickImage, !imagesEnabled() || uploading)}
          </>
        ) : (
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: C.faint, padding: '0 6px' }}>Vista previa</span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setTab(tab === 'write' ? 'preview' : 'write')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, color: C.primaryD }}
        >
          <Icon name={tab === 'write' ? 'visibility' : 'edit'} size={15} color={C.primary} />
          {tab === 'write' ? 'Vista previa' : 'Editar'}
        </button>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={ta}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste}
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault()
            if (!dragOver) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          rows={5}
          placeholder={placeholder || 'Escribe la descripción… Markdown soportado. Pega una imagen con Ctrl+V.'}
          style={{ ...inp(C), border: 'none', borderRadius: 0, background: 'transparent', minHeight: '110px' }}
        />
      ) : (
        <div className="md" style={{ color: C.text, padding: '11px 13px', minHeight: '110px' }}>
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {value}
            </ReactMarkdown>
          ) : (
            <span style={{ color: C.faint, fontStyle: 'italic', fontWeight: 500 }}>Sin descripción</span>
          )}
        </div>
      )}

      {(uploading || error) && (
        <div style={{ padding: '7px 12px', borderTop: '1px solid ' + C.line, fontSize: '12px', fontWeight: 600, color: error ? C.danger : C.muted, display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Icon name={error ? 'error' : 'hourglass_top'} size={15} color={error ? C.danger : C.muted} />
          {error || 'Subiendo imagen…'}
        </div>
      )}
    </div>
  )
}
