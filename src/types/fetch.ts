export type JSONValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JSONValue }
  | JSONValue[];

export interface GetJSONOptions extends RequestInit {
  timeoutMs?: number;
}

export interface PostJSONOptions extends RequestInit {
  timeoutMs?: number;
}
