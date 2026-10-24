import { serverEnv } from "@/server/env";
import { Type, type Static, type TSchema } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

const TokenSchema = Type.Object({
  access_token: Type.String(),
  expires_in: Type.Number(),
});

const PostSchema = Type.Object({
  kind: Type.Literal("t3"),
  data: Type.Object({
    id: Type.String(),
    title: Type.String(),
    author: Type.String(),
    created_utc: Type.Number(),
  }),
});

const CommentSchema = Type.Object({
  kind: Type.String(),
  data: Type.Object({
    name: Type.Optional(Type.String()),
    author: Type.Optional(Type.String()),
    body: Type.Optional(Type.String()),
    permalink: Type.Optional(Type.String()),
    created_utc: Type.Optional(Type.Number()),
    stickied: Type.Optional(Type.Boolean()),
  }),
});

const SearchSchema = Type.Object({
  data: Type.Object({ children: Type.Array(PostSchema) }),
});

const ThreadSchema = Type.Tuple([
  Type.Unknown(),
  Type.Object({
    data: Type.Object({ children: Type.Array(CommentSchema) }),
  }),
]);

export type RedditPost = Static<typeof PostSchema>["data"];
export type RedditComment = {
  id: string;
  author: string;
  body: string;
  permalink: string;
  createdAt: Date;
};

const POTD_SUBREDDIT = "sportsbook";
const POTD_AUTHOR = "sbpotdbot";

let token: { value: string; expires: number } | null = null;

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now()) return token.value;
  const reddit = serverEnv.reddit;
  // Script app, password grant: the official OAuth API, never the blocked public JSON.
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    signal: AbortSignal.timeout(15_000),
    headers: {
      authorization: `Basic ${Buffer.from(`${reddit.clientId}:${reddit.clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": reddit.userAgent,
    },
    body: new URLSearchParams({
      grant_type: "password",
      username: reddit.username,
      password: reddit.password,
    }),
  });
  if (!res.ok) throw new Error(`Reddit token: ${res.status}`);
  const body: unknown = await res.json();
  if (!Value.Check(TokenSchema, body))
    throw new Error("Reddit token: unexpected response");
  token = {
    value: body.access_token,
    expires: Date.now() + (body.expires_in - 60) * 1000,
  };
  return token.value;
}

async function oauthGet<T extends TSchema>(
  path: string,
  params: Record<string, string>,
  schema: T,
): Promise<Static<T>> {
  const url = new URL(`https://oauth.reddit.com${path}`);
  url.searchParams.set("raw_json", "1");
  for (const [key, value] of Object.entries(params))
    url.searchParams.set(key, value);
  const res = await fetch(url, {
    signal: AbortSignal.timeout(15_000),
    headers: {
      authorization: `Bearer ${await accessToken()}`,
      "user-agent": serverEnv.reddit.userAgent,
    },
  });
  if (!res.ok) throw new Error(`Reddit ${path}: ${res.status}`);
  const body: unknown = await res.json();
  if (!Value.Check(schema, body))
    throw new Error(`Reddit ${path}: unexpected response`);
  return body;
}

export async function findPotdThreads(): Promise<RedditPost[]> {
  const result = await oauthGet(
    `/r/${POTD_SUBREDDIT}/search`,
    {
      q: 'title:"Pick of the Day"',
      restrict_sr: "1",
      sort: "new",
      limit: "5",
    },
    SearchSchema,
  );
  return result.data.children
    .map((child) => child.data)
    .filter(
      (post) =>
        post.author === POTD_AUTHOR && post.title.startsWith("Pick of the Day"),
    );
}

export async function fetchTopLevelComments(
  postId: string,
): Promise<RedditComment[]> {
  const thread = await oauthGet(
    `/r/${POTD_SUBREDDIT}/comments/${encodeURIComponent(postId)}`,
    { limit: "500", depth: "1", sort: "new" },
    ThreadSchema,
  );
  return thread[1].data.children.flatMap((child) => {
    const c = child.data;
    if (
      child.kind !== "t1" ||
      c.stickied ||
      !c.name ||
      !c.author ||
      c.author === "[deleted]" ||
      c.author === "AutoModerator" ||
      c.author === POTD_AUTHOR ||
      !c.body ||
      !c.permalink ||
      c.created_utc === undefined
    )
      return [];
    return [
      {
        id: c.name,
        author: c.author,
        body: c.body,
        permalink: c.permalink,
        createdAt: new Date(c.created_utc * 1000),
      },
    ];
  });
}

const AboutSchema = Type.Object({
  data: Type.Object({
    subreddit: Type.Optional(
      Type.Union([
        Type.Object({ public_description: Type.Optional(Type.String()) }),
        Type.Null(),
      ]),
    ),
  }),
});

// The profile "About" text lives on the user's own profile subreddit.
export async function fetchUserDescription(name: string): Promise<string> {
  const about = await oauthGet(
    `/user/${encodeURIComponent(name)}/about`,
    {},
    AboutSchema,
  );
  return about.data.subreddit?.public_description ?? "";
}
