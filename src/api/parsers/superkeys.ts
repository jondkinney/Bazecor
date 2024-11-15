// import log from "electron-log/renderer";
import { SuperkeysType } from "@Renderer/types/superkeys";

export function parseSuperkeysRaw(raw: string, stored: SuperkeysType[]) {
  return raw
    .trim()
    .split(" 0 0")[0] // " 0 0" marks the end of the defined super keys
    .split(" 0 ") // " 0 " marks the end of each super key
    .map(actionString =>
      actionString
        .trim()
        .split(/ +/)
        .map(v => parseInt(v, 10))
        .filter(v => v > 0 && v < 65535),
    )
    .filter(actions => actions.length > 0)
    .map(
      (actions, id): SuperkeysType => ({
        id,
        actions,
        // The "match" to lookup the name is based on array index position
        name: stored.length >= id + 1 ? stored[id].name : "",
      }),
    );
}

export function serializeSuperkeys(superkeys: SuperkeysType[]): string {
  if (
    superkeys.length === 0 ||
    (superkeys.length === 1 && superkeys[0].actions.length === 0) ||
    (superkeys.length === 1 && superkeys[0].actions.length === 1 && superkeys[0].actions[0] === 0)
  ) {
    return Array(512).fill("65535").join(" ");
  }

  return (
    superkeys
      .map((sky: SuperkeysType) => {
        const sanitizedActions = sky.actions.map(action =>
          action === 0 || action === undefined || action === null ? 1 : action,
        );
        while (sanitizedActions.length < 5) {
          sanitizedActions.push(1);
        }
        sanitizedActions.push(0);
        return sanitizedActions.join(" ");
      })
      .join(" ") + " 0"
  );
}
