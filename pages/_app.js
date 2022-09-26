import { QueryClient, QueryClientProvider } from "react-query";
import '../styles/globals.css';
import 'antd/dist/antd.css';

const client = new QueryClient();

function MyApp({ Component, pageProps }) {
  return (
    <QueryClientProvider client={client}>
      <Component {...pageProps} />
    </QueryClientProvider>
  )
}

export default MyApp
