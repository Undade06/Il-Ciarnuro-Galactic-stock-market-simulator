# Il Ciarnuro: Galactic stock market simulator

## Program Access

To properly run the website, we have used **XAMPP version 3.3.0**, which is the software chosen to manage the local server. The project must be placed inside the `htdocs` directory of XAMPP. Then, it is essential to start the **Apache** and **MySQL** services from the XAMPP control panel to ensure the correct operation of the application and the database (`GSMSdb.sql`).

Once the services are started, the project can be opened in **localhost** by accessing the `Il-Ciarnuro-Galactic-stock-market-simulator` directory via a browser.

> **Disclaimer**: The website takes some time to start.

---

## Site Navigation

### landingPage
Clicking the central part of the page redirects to the `login_register` page.

### login_register
On this page, you can log in to the site:
- Entering your **username** and **password** in the respective input fields.
- Clicking the **Login** button, which allows you to view the `saves` page.
- Clicking the **Register** button, which redirects to the `registerPage` to create an account.

### registerPage
Here, you can register by:
- Entering the required information in the input fields.
- Clicking the **Create Account** button, which allows you to view the `saves` page.
- Returning to the login screen by clicking the **Back** button.

### saves
On this screen:
- Selecting a save file and after a short loading time, you are redirected to the `marketHomePage`, the site's homepage.

### marketHomePage
This is the main part of the website:
- Clicking on a stock title directs you to the `stockPage`.
- Clicking the **my_stocks** button, located within the **accessibility** section, leads to the `profilePage`.

### stockPage
On this page:
- Clicking the **backHome** button returns you to the `marketHomePage`.
- Clicking the **my_stocks** button takes you to the `profilePage`.

### profilePage
From this page:
- You can return to the `marketHomePage` using the **backHome** button.
- Selecting a stock title directs you to the `stockPage`.