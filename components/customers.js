import { useState } from "react";
import { FaCircleNotch } from "react-icons/fa";

export default function CustomersCard({ fetch, refcode, user_id, name, options }) {
  const [cx, setCx] = useState([]);
  const [emty, setEmty] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const cst = async (refcode, inputPage) => {
    setLoading(true);
    setEmty(false);
    if (!cx.length) {
      const cst = await fetch(refcode, inputPage ? inputPage : page);
      setCx(cst.data.user.customers);
      if (!cst.data.user.customers.length) setEmty(true);
    }
    if (cx.length && !inputPage) {
      setCx([]);
    }
    setLoading(false);
  };

  const changePageCst = async (method) => {
    switch (method) {
      case "+": setPage(page + 1); break;
      case "-": setPage(page - 1); break;
      default: setPage(1); break;
    }
    console.log(refcode, page)
    await cst(refcode, page)
  }
  return (
    <div key={user_id} className="p-6 bg-white shadow-md m-4 hover:bg-blue-200">
      <div onClick={async () => await cst(refcode)} className="cursor-pointer flex justify-between items-center">
        <div className="text-xl">
          <span className="font-bold">{user_id}</span> <span className="font-light">{name}</span> {
            options.min5user.eliglible ? "✅" : false
          }
        </div>
        <div>
          <div><span className="font-semibold">Total BV:</span> {options.trx_bvs}</div>
          <div><span className="font-semibold">Total Trx:</span> {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(options.trx_total)}</div>
        </div>
      </div>
      {cx ? (
        <div className="mt-2">
          <div>
            {cx.map(state => {
              return (
                <div key={state.cst_user_id} className="p-2 bg-slate-100 mb-2 shadow-md">
                  <div className="text-sm">
                    📨 {state.cst_email ? state.cst_email : "-"}{" | "}
                    📞 {state.cst_phone ? state.cst_phone : "-"}</div>
                  <div className="text-lg font-semibold">
                    🙍 {state.cst_name}
                  </div>
                  <div className="p-1 bg-white rounded-md mt-1">
                    <div style={{ fontSize: 11 }}>Trx Count: {state.cst_trx_count || '-'}</div>
                    <div style={{ fontSize: 11 }}>Total BV Generated: {state.cst_total_bvs || '-'}</div>
                    <div style={{ fontSize: 11 }}>Total Trx: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(state.cst_total_trx) || '-'}</div>
                  </div>
                </div>
              )
            })}
            {loading ? (
              <FaCircleNotch className="text-lg animate-spin"/>
            ) : false}
            {emty ? (
              <div className="text-sm font-light bg-red-100 p-2 mt-2">🙅‍♀️ Tidak memiliki Customers / Referals</div>
            ) : false}
          </div>
          {/* {cx.length ? (
            <div style={{ display: "flex", fontSize: 24, justifyContent: "space-between"}}>
              <div style={{ cursor: "pointer" }} onClick={async () => await changePageCst("-")}>⬅️ Prev Page</div>
              <div style={{ cursor: "pointer" }} onClick={async () => await changePageCst("+")}>➡️ Next Page</div>
          </div>
          ) : false} */}
        </div>
      ) : false}
    </div>
  )
}