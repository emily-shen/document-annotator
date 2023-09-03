import { Form } from "@remix-run/react";

const Login = () => {
  return (
    <>
      <div className="bg-gray-800 p-12 h-screen grid place-content-center">
        <div className="gap-8 h-full flex flex-col items-center">
          <h1 className="h-8 text-3xl font-bold text-center text-indigo-500">
            📄 Document Annotator
          </h1>

          <Form
            action="/auth/auth0"
            method="post"
            className="rounded-full bg-slate-500 text-white px-4 py-2 hover:bg-slate-600">
            <button className="text-gray-200">Login</button>
          </Form>
        </div>
      </div>
    </>
  );
};

export default Login;
