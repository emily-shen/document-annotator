import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { redirect, typedjson, useTypedLoaderData } from "remix-typedjson";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  let user = await authenticator.isAuthenticated(request);
  let userEmail = user?.email;
  if (user) {
    let dbUser = await db.annotator.findUnique({
      where: { email: userEmail },
      include: { documents: { select: { studyId: true } } },
    });
    return typedjson({ dbUser });
  } else {
    return redirect("/login");
  }
};

export const allocateDoc = async (userId: string) => {
  // NB documentAnnotators only has docs that has at least 1 annotator already!

  const completedDocs = await db.documentAnnotators.groupBy({
    by: ["studyId"],
    // get list of docs to **exclude**
    having: {
      studyId: { _count: { gte: 2 } },
    },
  });

  const userDone = await db.annotator.findUnique({
    where: { email: userId },
    include: { documents: { select: { studyId: true } } },
  });

  let userDoneArray = userDone?.documents.map((x) => x.studyId);

  let excludeDocs = userDoneArray?.concat(completedDocs.map((x) => x.studyId));

  const availDoc = await db.document.findFirst({
    where: { studyId: { notIn: excludeDocs } },
    include: {
      _count: {
        select: { annotators: true },
      },
    },
    orderBy: {
      annotators: {
        _count: "desc",
      },
    },
  });

  if (availDoc != null) {
    const assignDoc = await db.annotator.update({
      where: { email: userId },
      data: {
        current: {
          connect: {
            studyId: availDoc?.studyId,
          },
        },
      },
    });
    return assignDoc;
  } else {
    throw new Error("no available documents");
  }
};

export const action = async ({ request, params }: ActionArgs) => {
  let form = await request.formData();
  let { _action, ...values } = Object.fromEntries(form);

  if (_action === "assign") {
    const userId = form.get("userId") as string;
    const user = await db.annotator.findUnique({
      where: { email: userId },
      include: { documents: { select: { studyId: true } } },
    });

    if (user?.currentDoc == null) {
      const assignDoc = await allocateDoc(userId);
      return redirect(`/documents/${assignDoc?.currentDoc}`);
    } else {
      // already has assigned document, so just redirect to resume
      return redirect(`/documents/${user.currentDoc}`);
    }
  } else if (_action == "logout") {
    let clientId = process.env.AUTH_CLIENT_ID;
    let baseUrl = process.env.AUTH_TENANT;
    let returnUrl = process.env.AUTH_LOGIN;

    await authenticator.logout(request, {
      redirectTo: `https://${baseUrl}/v2/logout?client_id=${clientId}&returnTo=${returnUrl}`,
    });
  }
};

const IndexRoute = () => {
  const data = useTypedLoaderData<typeof loader>();
  return (
    <>
      <div className="bg-gray-800 text-gray-300 p-12 h-screen grid place-content-center">
        <div className="gap-8 h-full flex flex-col items-center">
          <h1 className="h-8 text-3xl font-bold text-center text-indigo-500">
            📄 Document Annotator
          </h1>
          <p className="text-center">
            User: {data.dbUser?.email}
            <br />
            Completed{" "}
            <span className="font-bold">
              {data.dbUser?.documents.length}
            </span>{" "}
            documents
          </p>
          <Form method="post">
            <input type="hidden" name="userId" value={data.dbUser?.email} />
            <button
              type="submit"
              name="_action"
              value="assign"
              className="rounded-full bg-indigo-500 text-gray-100 px-4 py-2">
              Start annotating
            </button>
          </Form>
          {/* <p>current: {data.dbUser?.currentDoc}</p> */}

          <hr className="border-1 h-1 border-slate-500 w-72" />

          <Form method="post">
            <button
              type="submit"
              name="_action"
              value="logout"
              className="rounded-full bg-slate-500 text-white px-4 py-2">
              Logout
            </button>
          </Form>
        </div>
      </div>
    </>
  );
};

export default IndexRoute;
