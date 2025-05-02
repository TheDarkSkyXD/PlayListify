// This script is loaded before anything else
import './utils/monkeyPatch';

// Now export the warning function so it's available for other modules
export { default as warning } from './utils/monkeyPatch'; 