import { WebDriver } from 'selenium-webdriver';
import AxeBuilder from './AxeBuilder';
import { Options as AxeInjectorOptions } from './AxeInjector';

function createAxeBuilder(
  driver: WebDriver,
  source?: string,
  builderOptions?: AxeInjectorOptions
): AxeBuilder;

export default createAxeBuilder;
