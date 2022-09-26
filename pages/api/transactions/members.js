import serverlessMysql from "serverless-mysql";
import setLOByPageLimit from "../../../fns/paging";

const mysql = serverlessMysql({
  config: {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
  }
});

export default async function handler(req, res) {
  const { refcode = false, page = 1, limit = 10, start, end } = req.query;
  const { L, O } = setLOByPageLimit(page, limit);
  const result = await mysql.query(`
    SELECT
      DISTINCT ucd.id_member as member_id,
      ucd.id_user as member_user_id,
      ucd.fullname as member_name,
      ucd.member_refcode as member_refer_code
    FROM
      klink_digital_usrsvc_new.user_consumer_details ucd
    INNER JOIN
      klink_digital_usrsvc_new.users ux ON ucd.id_user = ux.id
    WHERE
      ucd.consumer_type = "MEMBER"
    ${refcode ? `AND ucd.member_refcode = "${refcode}"` : ""}
    AND
      ux.is_verified = 1
    AND
      ux.is_active = 1
    ORDER BY
      ucd.id DESC
    LIMIT ${L}
    OFFSET ${O};
  `);

  const filterByStartDate = `AND o.created_at >= "${start} 00:00"`;
  const filterByEndDate = `AND o.created_at <= "${end} 23:59"`;

  // get each of tranxaction count, total and bvs from result
  const nextResult = [];
  await Promise.all(
    result.map(async r => {
      // cari customer yang pake referal code juga di bawah ini
      const customers = await mysql.query(`
        SELECT DISTINCT ucd.id_user as id
        FROM klink_digital_usrsvc_new.user_consumer_details ucd
        WHERE ucd.customer_reg_refcode = "${r.member_refer_code}"
      `);
      
      let customersId = '';
      await Promise.all(
        customers.map(cust => customersId += `"${cust.id}",`)
      )
      const options1 = await mysql.query(`
        SELECT
          COUNT(*) AS trx_count,
          SUM(IFNULL(od.total_bv, 0)) as trx_bvs,
          SUM(IFNULL(od.total_price, 0)) as trx_total
        FROM klink_digital.orders o
        INNER JOIN klink_digital.order_details od ON o.id = od.id_order
        WHERE o.id_member = "${r.member_user_id}"
        AND o.order_status_latest NOT IN (
          "CANCELED","WAITING_FOR_COD_CONFIRMATION","WAITING_FOR_PAYMENT","WAITING_FOR_SELLER_CONFIRMATION","ORDER_RETURN"
        )
        ${customersId !== '' ? `AND o.id_customer IN (${customersId}"0x0")` : ''}
        ${start ? filterByStartDate : ''}
        ${end ? filterByEndDate : ''};
      `);
      const options2 = customersId !== '' ? await mysql.query(`
        SELECT
          COUNT(*) AS trx_count,
          SUM(IFNULL(od.total_bv, 0)) as trx_bvs,
          SUM(IFNULL(od.total_price, 0)) as trx_total
        FROM klink_digital.orders o
        INNER JOIN klink_digital.order_details od ON o.id = od.id_order
        AND o.id_customer IN (${customersId}"0x0")
        AND o.order_status_latest NOT IN (
          "CANCELED","WAITING_FOR_COD_CONFIRMATION","WAITING_FOR_PAYMENT","WAITING_FOR_SELLER_CONFIRMATION","ORDER_RETURN"
        )
        ${start ? filterByStartDate : ''}
        ${end ? filterByEndDate : ''};
      `) : false;

      const min5User = await mysql.query(`
        SELECT
          o.id_customer as id_customer,
          count(*) as trx_per_customer
        FROM klink_digital.orders o
        INNER JOIN klink_digital.order_details od ON o.id = od.id_order
        WHERE o.id_member = "${r.member_user_id}"
        ${customersId !== '' ? `OR o.id_customer IN (${customersId}"0x0")` : ''}
        AND o.order_status_latest NOT IN (
          "CANCELED","WAITING_FOR_COD_CONFIRMATION","WAITING_FOR_PAYMENT","WAITING_FOR_SELLER_CONFIRMATION","ORDER_RETURN"
        )
        ${start ? filterByStartDate : ''}
        ${end ? filterByEndDate : ''}
        GROUP BY o.id_customer
        LIMIT 100000;
      `);

      const min5UserCheck = [];

      await Promise.all(
        min5User.map(min => {
          if (min.trx_per_customer >= 5) min5UserCheck.push(min.id_customer)
        })
      )

      const data = {
        ...r,
        options: {
          trx_count: parseInt(options1[0].trx_count + (options2 ? options2[0].trx_count : 0)),
          trx_bvs: parseInt(options1[0].trx_bvs + (options2 ? options2[0].trx_bvs : 0)),
          trx_total: parseInt(options1[0].trx_total + (options2 ? options2[0].trx_total : 0)),
          min5user: {
            data: min5User,
            eliglible: min5UserCheck.length >= process.env.MIN_CST_TRX ? true : false,
          }
        }
      }
      
      nextResult.push(data);
    })
  )

  await mysql.end();
  mysql.quit();

  res.status(200).json(nextResult);
}