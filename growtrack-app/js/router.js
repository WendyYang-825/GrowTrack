const Router = {
  routes: {},
  currentRoute: null,

  register(path, handler) {
    this.routes[path] = handler;
  },

  init() {
    window.addEventListener('hashchange', () => this.handle());
    this.handle();
  },

  handle() {
    const hash = window.location.hash.slice(1) || '/dashboard';
    const route = hash.split('/')[1] || 'dashboard';

    // Auth pages don't need sidebar
    const authPages = ['login', 'register'];
    const isAuthPage = authPages.includes(route);
    document.getElementById('sidebar').style.display = isAuthPage ? 'none' : '';
    document.getElementById('mobileHeader').style.display = isAuthPage ? 'none' : '';
    document.getElementById('mainContent').style.marginLeft = isAuthPage ? '0' : '';

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.toggle('nav-item--active', item.dataset.route === route);
    });

    if (this.routes[route]) {
      this.currentRoute = route;
      this.routes[route]();
    } else {
      this.routes['dashboard']();
    }

    const container = document.getElementById('pageContainer');
    if (container) container.scrollTop = 0;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar.classList.contains('sidebar--open')) {
      sidebar.classList.remove('sidebar--open');
      overlay.classList.remove('overlay--visible');
    }
  },

  navigate(route) {
    window.location.hash = '#/' + route;
  },
};
