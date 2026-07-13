import './fonts.css';
import './style.css';
import { mount } from './render';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('#app root element not found');

mount(app);
