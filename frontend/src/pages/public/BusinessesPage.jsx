// Generated using Claude
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import Pagination from '../../components/Pagination';
import Avatar from '../../components/Avatar';
import { PageSpinner } from '../../components/Spinner';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [order, setOrder] = useState('asc');
  const [loading, setLoading] = useState(true);
  const limit = 9;

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.keyword = search;
      if (sort) { params.sort = sort; params.order = order; }
      const res = await api.get('/businesses', { params });
      setBusinesses(res.data.results);
      setCount(res.data.count);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, order]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(keyword);
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Dental Clinics</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{count} businesses</span>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            className="input flex-1"
            placeholder="Search businesses…"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <button type="submit" className="btn-primary px-4">Search</button>
        </form>
        <select
          className="input w-auto"
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1); }}
        >
          <option value="">Sort by…</option>
          <option value="business_name">Name</option>
          <option value="email">Email</option>
        </select>
        <select
          className="input w-auto"
          value={order}
          onChange={e => { setOrder(e.target.value); setPage(1); }}
        >
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>

      {loading ? (
        <PageSpinner />
      ) : businesses.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No businesses found.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map(b => (
            <Link
              key={b.id}
              to={`/businesses/${b.id}`}
              className="card hover:border-primary-300 dark:hover:border-primary-600 transition-colors flex gap-4 items-start"
            >
              <Avatar src={b.avatar} name={b.business_name} size="lg" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{b.business_name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">{b.postal_address || b.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{b.phone_number}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination page={page} total={count} limit={limit} onPageChange={setPage} />
    </div>
  );
}
