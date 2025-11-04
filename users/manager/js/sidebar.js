document.addEventListener('DOMContentLoaded', () => {
  fetch('manager_sidebar.html')
    .then(response => {
      if (!response.ok) throw new Error('Failed to load sidebar: ' + response.status);
      return response.text();
    })
    .then(data => {
      // Insert the sidebar *before* the #content div
      const content = document.getElementById('content');
      content.insertAdjacentHTML('beforebegin', data);
    })
    .catch(error => {
      console.error(error);
      document.body.insertAdjacentHTML(
        'afterbegin',
        '<div style="color:red; padding:10px;">⚠️ Failed to load sidebar.</div>'
      );
    });
});

