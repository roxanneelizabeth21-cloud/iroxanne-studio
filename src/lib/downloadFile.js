// Cross-origin files ignore the <a download> attribute, so fetch the bytes and
// save them from a local blob URL instead — that always downloads.
export async function downloadFile(url, filename) {
  const res = await fetch(url);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}