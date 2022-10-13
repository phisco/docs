export function customJS() {
  const tableLinks = document.querySelectorAll('#TableOfContents ul li a');
  const checkboxes = document.querySelectorAll('.checkbox');
  const checkbox = document.getElementsByClassName('.checkbox');

  for (const link of tableLinks) {
    link.addEventListener('click', () => {
      for (const innerCheck of checkboxes) {
        innerCheck.checked = false;
      }
    });
  }

  for (const check of checkboxes) {
    check.addEventListener('change', (e) => {
      for (const innerCheck of checkboxes) {
        if (innerCheck !== e.target) {
          innerCheck.checked = false;
        }
      }
    });
  }
}
