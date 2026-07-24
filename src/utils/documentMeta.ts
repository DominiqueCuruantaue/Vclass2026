// Extração de metadados de documentos enviados para a biblioteca (nº de páginas).
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * Verifica a assinatura mágica "%PDF-" no início do ficheiro.
 * Apanha uploads de ficheiros corrompidos/inexistentes (ex: uma página de erro
 * "File not found" guardada com extensão .pdf) antes de irem para o storage.
 */
export function isValidPdfSignature(buffer: ArrayBuffer): boolean {
  const header = new Uint8Array(buffer.slice(0, 5))
  return String.fromCharCode(...header) === '%PDF-'
}

/**
 * Tenta extrair o número de páginas de um PDF ou .docx.
 * .doc (formato binário legado) não é suportado — devolve null.
 */
export async function extractPageCount(buffer: ArrayBuffer, fileType: string, fileName: string): Promise<number | null> {
  const name = fileName.toLowerCase()
  const isPdf  = fileType === 'application/pdf' || name.endsWith('.pdf')
  const isDocx = fileType === DOCX_MIME || name.endsWith('.docx')

  if (isPdf) {
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      return pdfDoc.getPageCount()
    } catch {
      return null // PDF corrompido/protegido — deixa o campo em branco para preenchimento manual
    }
  }

  if (isDocx) {
    try {
      const zip = await JSZip.loadAsync(buffer)
      const appXml = await zip.file('docProps/app.xml')?.async('string')
      if (!appXml) return null
      // O Word grava a contagem de páginas calculada na última gravação em <Pages>N</Pages>
      const match = appXml.match(/<Pages>(\d+)<\/Pages>/)
      return match ? parseInt(match[1], 10) : null
    } catch {
      return null // .docx corrompido/inesperado — deixa o campo em branco
    }
  }

  // .doc (binário legado) — sem parser disponível
  return null
}
