import { plan } from "./engine.js";
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ id: data.id, result: plan(data.scenario) });
  } catch (error) {
    self.postMessage({ id: data.id, error: error.message });
  }
};
