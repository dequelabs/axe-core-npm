import { WebDriver, Builder } from 'selenium-webdriver';
import net from 'net';
import chrome from 'selenium-webdriver/chrome';

export const Webdriver = (): WebDriver => {
  let webdriver: WebDriver;
  if (process.env.REMOTE_SELENIUM_URL) {
    webdriver = new Builder()
      .forBrowser('chrome')
      .usingServer(process.env.REMOTE_SELENIUM_URL)
      .setChromeOptions(new chrome.Options().headless())
      .build();
  } else {
    webdriver = new Builder()
      .setChromeOptions(new chrome.Options().headless())
      .forBrowser('chrome')
      .build();
  }
  return webdriver;
};

export const connectToChromeDriver = (port: number): Promise<void> => {
  let socket: net.Socket;
  return new Promise((resolve, reject) => {
    // Give up after 1s
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Unable to connect to ChromeDriver'));
    }, 1000);

    const connectionListener = (): void => {
      clearTimeout(timer);
      socket.destroy();
      return resolve();
    };

    socket = net.createConnection(
      { host: 'localhost', port },
      connectionListener
    );

    // Fail on error
    socket.once('error', (err: Error) => {
      clearTimeout(timer);
      socket.destroy();
      return reject(err);
    });
  });
};
