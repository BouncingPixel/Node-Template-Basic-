const $ = require('jquery');
const Slidebars = require('../../libs/slidebars');

// --Slidebars implementation --
const controller = new Slidebars();
controller.init();

$('#mobile-menu-toggle').on('click', (e) => {
  e.stopPropagation();
  e.preventDefault();
  controller.toggle('mobile-nav-canvas');
  document.querySelector('body').classList.toggle('slidebars-open');
});

$('.nav-sub-button').on('click', (e) => {
  //Prevent the nav from closing like it does when you click a link
  e.stopImmediatePropagation();
  if (e.currentTarget.dataset && e.currentTarget.dataset.name) {
    Array.from(document.querySelectorAll('ul.mobile-nav-sub-list'))
    .map(subList => { //Close all open menus
      subList.classList.add('hidden');
      return subList;
    }).filter(subList => ( //Find the matching sublist name and remove hidden
      e.currentTarget.dataset.name.toLowerCase() === subList.dataset.name.toLowerCase()
    )).map(subList => subList.classList.toggle('hidden'));
  }
});

$('body').on('click', (_e) => {
  if ($('.slidebars-open').length > 0) {
    controller.close();
    $('body').removeClass('slidebars-open');
  }
});
