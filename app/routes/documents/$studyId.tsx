import React, { useEffect, useState, useRef } from "react";
import { LoaderArgs, ActionArgs } from "@remix-run/node";
import { Form, Link } from "@remix-run/react";
import { db } from "~/utils/db.server";
import { anatOptions, compOptions, attrOptions } from "~/utils/options";
import {
  redirect,
  typedjson,
  useTypedLoaderData,
  useTypedActionData,
} from "remix-typedjson";
import { allocateDoc } from "../index";
import { authenticator } from "~/utils/auth.server";
import CustomSelect from "~/components/Select";

export const loader = async ({ params, request }: LoaderArgs) => {
  let authUser = await authenticator.isAuthenticated(request);
  let userEmail = authUser?.email;

  if (authUser) {
    const user = await db.annotator.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        email: true,
        documents: { select: { studyId: true } },
        annotations: true,
      },
    });

    const document = await db.document.findUnique({
      where: { studyId: params.studyId },
      include: {
        annotations: true,
        annotators: { where: { annoId: user?.id } },
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }
    return typedjson({ document, user, params });
  } else {
    return redirect("/login");
  }
};

export const action = async ({ request, params }: ActionArgs) => {
  let form = await request.formData();
  let { _action, ...values } = Object.fromEntries(form);

  switch (_action) {
    case "create":
      const anat = form.get("Anatomy");
      const attr = form.get("Attribute");
      const comp = form.get("Comparison");
      const docId = params.studyId;

      if (
        typeof anat !== "string" ||
        typeof attr !== "string" ||
        typeof comp !== "string"
      ) {
        throw new Error("Form input is invalid");
      }

      if (anat != "" && attr != "" && comp != "") {
        const fields = { anat, attr, comp };
        const document = await db.document.update({
          where: { studyId: docId },
          data: {
            annotations: {
              create: fields,
            },
          },
        });
        return null;
      } else {
        return null;
      }

    case "delete":
      const annoId = form.get("annoId") as string;
      const deleteAnnotation = await db.annotation.delete({
        where: {
          id: annoId,
        },
      });
      return null;

    case "save":
      const userId = form.get("userId") as string;

      const saveDoc = await db.annotator.update({
        where: { email: userId },
        // connect document and annotator under 'documents' field
        data: {
          documents: {
            create: [
              {
                document: {
                  connect: { studyId: params.studyId },
                },
              },
            ],
          },
          // delete relation in 'current'
          current: { disconnect: true },
        },
      });
      // allocate new doc to 'current'
      const assignDoc = await allocateDoc(userId);

      return redirect(`/documents/${assignDoc?.currentDoc}`);

    case "logout":
      let clientId = process.env.AUTH_CLIENT_ID;
      let baseUrl = process.env.AUTH_TENANT;
      let returnUrl = process.env.AUTH_LOGIN;

      await authenticator.logout(request, {
        redirectTo: `https://${baseUrl}/v2/logout?client_id=${clientId}&returnTo=${returnUrl}`,
      });
  }
};

type HeaderProp = {
  text: string;
};

const Header = ({ text }: HeaderProp) => {
  return (
    <>
      <p className="text-indigo-400 uppercase text-sm font-bold tracking-wide">
        {text}
      </p>
    </>
  );
};

const DocumentRoute = () => {
  const data = useTypedLoaderData<typeof loader>();
  const actionData = useTypedActionData<typeof action>();

  // ensures the most recent annotation is always visible
  const [annoLength, setAnnoLength] = useState(
    data.document.annotations.length
  );
  const [animate, setAnimate] = useState(false);
  const ref = useRef<HTMLTableRowElement>(null);
  useEffect(() => {
    if (ref.current !== null) {
      ref.current.scrollIntoView();
    }
    if (data.document.annotations.length > annoLength) {
      setAnimate(true);
    }
    setAnnoLength(data.document.annotations.length);
  }, [data.document.annotations]);

  // only current document should be editable
  const [editable, setEditable] = useState(true);
  useEffect(() => {
    let completed = data.user?.documents.map((x) => x.studyId) ?? [];
    let current = data.params.studyId ?? "";
    setEditable(!completed.includes(current));
  }, [data.params.studyId]);

  if (editable) {
    return (
      <>
        <div className="bg-gray-800 px-12 py-4 h-screen text-gray-300 flex flex-col">
          <div className="w-full h-12 flex border-b border-slate-600">
            <p className="h-8 text-2xl font-bold text-indigo-400 w-2/6">
              <Link to="/">📄 Document Annotator</Link>
            </p>

            <Form method="post" className="ml-auto h-12">
              <p className="inline-block mr-4">{data.user?.email}</p>
              <button
                type="submit"
                name="_action"
                value="logout"
                className="rounded-full text-sm bg-slate-500 text-white px-3 py-2">
                Logout
              </button>
            </Form>
          </div>

          <div className="gap-4 mt-6 h-0 grow flex flex-col flex-wrap">
            <Header text="Report Text" />
            <div className="mb-4 w-2/6 h-fit max-h-[40%] p-4 rounded-lg place-content-center bg-gray-600 text-gray-300 ring-1 ring-gray-900/5">
              <div className="h-full overflow-x-scroll">
                <p>{data.document.contents} ❌</p>
              </div>
            </div>

            <hr className="border-1 h-1 border-slate-600 w-2/6" />
            <Header text="Add New" />
            <Form
              method="post"
              className="flex flex-wrap gap-x-8 gap-y-4 place-content-center w-2/6">
              <>
                <label className="grow font-bold text-sm">
                  Anatomy
                  <CustomSelect name={"Anatomy"} options={anatOptions} />
                </label>
                <label className="grow font-bold text-sm">
                  Comparison
                  <CustomSelect name={"Comparison"} options={compOptions} />
                </label>
                <label className="w-full font-bold text-sm">
                  Attribute
                  <CustomSelect name={"Attribute"} options={attrOptions} />
                </label>

                <div className="w-full">
                  <button
                    type="submit"
                    name="_action"
                    value="create"
                    className="rounded-full bg-indigo-500 text-white px-4 py-2">
                    Submit
                  </button>
                </div>
              </>
            </Form>
            <div className="w-0 basis-full"></div>

            <Header text="Existing annotations" />

            <div className="w-4/6 place-content-center h-[75%] pr-[2rem]">
              <div className="overflow-x-scroll h-full relative rounded-md w-full bg-gray-500 ">
                <table className="w-full table-auto text-gray-300 relative">
                  <thead>
                    <tr>
                      <th className="text-left font-bold p-2 pl-4 sticky top-0 bg-gray-700 text-gray-300 ">
                        Attribute
                      </th>
                      <th className="text-left font-bold p-2 pl-4 sticky top-0 bg-gray-700 text-gray-300 ">
                        Anatomical Location
                      </th>
                      <th className="text-left font-bold p-2 pl-4 sticky top-0 bg-gray-700 text-gray-300 ">
                        Comparison
                      </th>
                      <th className="text-left font-bold p-2 pl-4 sticky top-0 bg-gray-700 text-gray-300 "></th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.document.annotations.map((annotation, index) => (
                      <tr
                        className={
                          "border-t bg-gray-600 border-t-slate-700 border-b border-b-slate-700" +
                          (index + 1 == data.document.annotations.length &&
                          animate
                            ? " animate-[flash_1s_ease-in-out_1]"
                            : "")
                        }
                        onAnimationEnd={() => setAnimate(false)}
                        ref={
                          index + 1 == data.document.annotations.length
                            ? ref
                            : null
                        }
                        key={index}>
                        <td className="p-2 pl-4">{annotation.anat}</td>
                        <td className="p-2 pl-4">{annotation.attr}</td>
                        <td className="p-2 pl-4">{annotation.comp}</td>
                        <td>
                          <Form method="post">
                            <input
                              type="hidden"
                              name="annoId"
                              value={annotation.id}
                            />
                            <button
                              type="submit"
                              aria-label="delete"
                              name="_action"
                              value="delete">
                              ×
                            </button>
                          </Form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Form method="post" className="w-fit mr-0 ml-auto pr-[2rem]">
              <input type="hidden" name="userId" value={data.user?.email} />
              <button
                type="submit"
                name="_action"
                value="save"
                className="rounded-full bg-indigo-500 text-white px-4 py-2 mt-2">
                Save and Submit Document
              </button>
            </Form>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="bg-gray-800 text-gray-300 p-12 h-screen flex flex-col place-content-center text-center">
          <p>
            This document has already been submitted and cannot be edited.
            <br />
            Go back to the home page to be allocated a new document.
            <br />
            <button className="mt-4 rounded-full w-fit bg-indigo-500 text-white px-4 py-2">
              <Link to="/">Home</Link>
            </button>
          </p>
        </div>
      </>
    );
  }
};

export default DocumentRoute;
