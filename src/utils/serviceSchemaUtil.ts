import * as fs from "fs";
import * as path from "path";
export async function getServiceApi(service: string) {
  const servicesPath = path.join(__dirname, "..", "..", "services");
  const files = fs.readdirSync(servicesPath);
  const serviceVersions = files
    .filter((file) => file.startsWith(service + "-20"))
    .sort((a, b) => (a < b ? 1 : -1));

  return JSON.parse(fs.readFileSync(servicesPath + "/" + serviceVersions[0]).toString("utf8"));
}
