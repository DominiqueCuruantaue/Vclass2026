// Extração de metadados de documentos enviados para a biblioteca (nº de páginas).
import { PDFDocument } from 'pdf-lib'
import JSZip from 'jszip'

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * Verifica a assinatura mágica "%PDF-" no ficheiro.
 * Apanha uploads de ficheiros corrompidos/inexistentes (ex: uma página de erro
 * "File not found" guardada com extensão .pdf) antes de irem para o storage.
 *
 * Procura nos primeiros 1024 bytes, não só no byte 0 — o próprio spec do PDF
 * (ISO 32000-1 §7.5.2) permite bytes de lixo/BOM antes do header, e vários
 * geradores reais (scanners móveis, "Imprimir para PDF", LibreOffice) produzem
 * ficheiros válidos com esse desvio.
 */
export function isValidPdfSignature(buffer: ArrayBuffer): boolean {
  const scanLength = Math.min(buffer.byteLength, 1024)
  const bytes = new Uint8Array(buffer.slice(0, scanLength))
  const sig = [0x25, 0x50, 0x44, 0x46, 0x2d] // "%PDF-"
  for (let i = 0; i <= bytes.length - sig.length; i++) {
    if (sig.every((b, j) => bytes[i + j] === b)) return true
  }
  return false
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
