export function renderFooter() {
  const el = document.getElementById('footer-root');
  if (!el) return;
  el.innerHTML = `
    <footer class="footer">
      <p>&copy; ${new Date().getFullYear()} MOFATE Event & Innovation Hub (MEIH). All rights reserved.</p>
    </footer>
  `;
}
