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
  const { refcode, page = 1, limit = 10, start, end } = req.query;
  if (!refcode) {
    res.status(500).json({ note: "Please provide refcode" });
  }

  const filterByStartDate = `AND o.created_at >= "${start} 00:00"`;
  const filterByEndDate = `AND o.created_at <= "${end} 23:59"`;

  const { L, O } = setLOByPageLimit(page, limit);

  const result = await mysql.query(`
    SELECT
      ux.id as cst_user_id,
      ucx.fullname as cst_name,
      ux.email as cst_email,
      ux.devicenumber as cst_phone,
      (
          SELECT COUNT(*) FROM klink_digital.orders o
          WHERE o.id_customer = ux.id AND
          o.order_status_latest NOT IN (
            "CANCELED","WAITING_FOR_COD_CONFIRMATION","WAITING_FOR_PAYMENT","WAITING_FOR_SELLER_CONFIRMATION","ORDER_RETURN"
          )
          ${start ? filterByStartDate : ''}
          ${end ? filterByEndDate : ''}
      ) as cst_trx_count,
      (
          SELECT SUM(IFNULL(od.total_bv, 0)) as bvs
          FROM klink_digital.orders o
          INNER JOIN klink_digital.order_details od ON o.id = od.id_order
          WHERE o.id_customer = ux.id AND
          o.order_status_latest NOT IN (
            "CANCELED","WAITING_FOR_COD_CONFIRMATION","WAITING_FOR_PAYMENT","WAITING_FOR_SELLER_CONFIRMATION","ORDER_RETURN"
          )
          ${start ? filterByStartDate : ''}
          ${end ? filterByEndDate : ''}
      ) as cst_total_bvs,
      (
        SELECT SUM(IFNULL(od.total_price, 0)) as trx
        FROM klink_digital.orders o
        INNER JOIN klink_digital.order_details od ON o.id = od.id_order
        WHERE o.id_customer = ux.id AND
        o.order_status_latest NOT IN (
          "CANCELED","WAITING_FOR_COD_CONFIRMATION","WAITING_FOR_PAYMENT","WAITING_FOR_SELLER_CONFIRMATION","ORDER_RETURN"
        )
        ${start ? filterByStartDate : ''}
        ${end ? filterByEndDate : ''}
    ) as cst_total_trx
    FROM
      klink_digital_usrsvc_new.user_consumer_details ucx
    INNER JOIN
      klink_digital_usrsvc_new.users ux ON ucx.id_user = ux.id
    WHERE ucx.consumer_type = "NON-MEMBER"
    AND ucx.customer_reg_refcode = "${refcode}"
    AND ux.is_verified = 1
    AND ux.is_active = 1
    ORDER BY
      ucx.id DESC
    LIMIT ${L}
    OFFSET ${O};
  `);

  await mysql.end();
  mysql.quit();

  res.status(200).json({ user: {
    member_refcode: refcode,
    customers: result
  }});
}