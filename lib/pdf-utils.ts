export const generateMarksheetPDF = (element: HTMLElement, fileName: string) => {
  const html2pdf = (window as any).html2pdf
  if (!html2pdf) {
    alert('PDF library not loaded')
    return
  }

  const opt = {
    margin: 10,
    filename: fileName,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  }

  html2pdf().set(opt).from(element).save()
}
