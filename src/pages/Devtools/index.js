const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

if (browserAPI?.devtools?.panels) {
  browserAPI.devtools.panels.create(
    'Dev Tools from chrome-extension-boilerplate-react',
    'icon-34.png',
    'panel.html'
  );
}
