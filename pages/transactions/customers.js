import { useEffect, useState } from "react";
import axios from "axios"
import { useQuery } from "react-query";
import { FaCircleNotch } from "react-icons/fa";
import { DatePicker } from "antd";

import useDebounce from "../../hooks/useDebounce";

import CustomersCard from "../../components/customers";
import PagingButton from "../../components/pagingbutton";



export default function CustomerTransactionPage() {
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [byRefcode, setByRefcode] = useState(''); //&refcode=citraciki
  const [dateRange, setDateRange] = useState(['', '']);

  const [startDate, endDate] = dateRange;
  const debouncedRefCode = useDebounce(byRefcode, 500);

  const handlePagination = (action, loading) => {
    if (loading) return false;
    switch (action) {
      case "prev":
        if (page >= 2) setPage(page - 1);
        break;
      case "next":
        setPage(page + 1);
        break;
    }
  }

  const handleByRefcode = refcode => {
    let rc = ''
    if (refcode) {
      rc = `&refcode=${refcode}`
    }
    setByRefcode(rc);
  }

  const handleDateRange = (_dates, dateStrings) => {
    const [start, end] = dateStrings;
    if (start !== '' || end !== '') {
      setDateRange(
        [
          start ? `&start=${start}` : '',
          end ? `&end=${end}` : ''
        ]
      );
    } else {
      setDateRange(['', '']);
    }
  }

  const fetchMembers = () => {
    return axios({
      url:
        `/api/transactions/members?limit=${limit}&page=${page}${byRefcode}${startDate}${endDate}`
    });
  };

  const fetchCustomers = (refcode, page = 1) => {
    return axios({
      url: "/api/transactions/customer?limit=1000000&refcode=" + refcode + "&page=" + page + startDate + endDate
    });
  };

  const rqMembers = useQuery("trx-members", fetchMembers);

  // update members when change limit
  useEffect(() => {
    rqMembers.refetch();
  }, [rqMembers, limit, page, debouncedRefCode]);

  useEffect(() => {
    const [startDate, endDate] = dateRange;
    if (startDate === '' || endDate === '') {
      console.log("Please provide in between dates")
    }
    else 
    if (startDate !== '' && endDate !== '') {
      rqMembers.refetch();
    }
  }, [rqMembers, dateRange])

  if (rqMembers.error) return "An error has occured";

  return (
    <div className="bg-slate-100 h-min-[100vh]">
      <div className="grid grid-cols-12 gap-4 p-2 bg-black text-white">
        <div className="col-span-6">
          <div className="text-sm font-semibold">Search:</div>
          <div className="flex grid grid-cols-4 gaps-4">
            <div className="col-span-2">
              <div className="text-xs mb-2">By Customer Trx Date:</div>
              <div className="text-xl text-black">
                <DatePicker.RangePicker className="w-[90%]" onChange={handleDateRange} />
                {/* <input className="border-2 w-[95%]" type="text" placeholder="Ganti ini pake range"></input> */}
              </div>
            </div>
            <div className="col-span-2">
              <div className="text-xs mb-2">By Refcode:</div>
              <div className="text-xl text-black">
                <input className="border-2 w-[90%]" type="text" placeholder="Refcode?" onChange={e => handleByRefcode(e.target.value)}></input>
              </div>
            </div>
          </div>
        </div>
        <div className="flex col-span-6 grid grid-cols-8">
          <div className="col-span-3"></div>
          <div className="col-span-4 flex justify-between items-center">
            <PagingButton text="⬅️ Prev" action={handlePagination} todo="prev" loading={rqMembers.isLoading} />
            <PagingButton text="Next ➡️" action={handlePagination} todo="next" loading={rqMembers.isLoading} />
          </div>
          <div className="col-span-1 text-xl items-center justify-center flex flex-col">
            <div>Limit:</div>
            <select className="border-2 text-black" onChange={e => setLimit(e.target.value)}>
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={1000000}>All</option>
            </select>
          </div>
        </div>
      </div>
      <div className="py-6 px-4 bg-white m-4 rounded-lg shadow-sm text-sm">
        {
          rqMembers.isRefetching ? (
            <FaCircleNotch className="text-2xl animate-spin"/>
          ) : (
            <div>
              <span>
                <span className="font-semibold">Members</span> Page {page + ' | '}
              </span>
              <span>
                {dateRange[0] && dateRange[1] ? (
                  <span><span className="font-semibold">Transaksi</span> Customer Pertanggal {startDate.split("=")[1]} - {endDate.split("=")[1] + ' | '}</span>
                ) : false}
              </span>
              <span>
                {byRefcode ? (
                  <span><span className="font-semibold">Pencarian</span> Member berdasarkan Refcode: <span className="font-semibold">{byRefcode.split("=")[1] + ' | '}</span></span>
                ) : false}
              </span>
              ☃️
            </div>
          )
        }
      </div>
      <div>
        {rqMembers.isLoading ? (
          <div className="p-6 my-4">
            Loading
          </div>
        ) : rqMembers.data.data.map(member => {
          return (
            <CustomersCard
              fetch={fetchCustomers}
              refcode={member.member_refer_code}
              user_id={member.member_id}
              name={member.member_name}
              options={member.options}
              key={JSON.stringify(member)}
            />
          )
        })}
      </div>
    </div>
  )
}