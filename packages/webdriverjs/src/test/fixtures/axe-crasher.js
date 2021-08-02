if (document.documentElement.classList.contains('crash-me')) {
  window.axe.run = function () {
    throw new Error('Crashing axe.run(). Boom!');
  };
  if (window.axe.runPartial) {
    window.axe.runPartial = function () {
      throw new Error('Crashing axe.runPartial(). Boom!');
    };
  }
}
