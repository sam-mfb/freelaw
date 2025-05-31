import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  setSearchTerm,
  setCourtFilter,
  setDateFilter,
  setOnlyActive,
  clearFilters,
} from '../store/casesSlice';

export const CaseSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const { searchTerm, filters, index } = useAppSelector((state) => state.cases);
  const [dateFrom, setDateFrom] = useState(filters.dateFrom || '');
  const [dateTo, setDateTo] = useState(filters.dateTo || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleCourtChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setCourtFilter(e.target.value || null));
  };

  const handleDateChange = () => {
    dispatch(setDateFilter({ from: dateFrom, to: dateTo }));
  };

  return (
    <div className="case-search">
      <h2>Search Cases</h2>

      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by case name..."
        className="search-input"
      />

      <select value={filters.court || ''} onChange={handleCourtChange} className="court-filter">
        <option value="">All Courts</option>
        {index?.courts.map((court) => (
          <option key={court.code} value={court.code}>
            {court.name}
          </option>
        ))}
      </select>

      <div className="date-filters">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          onBlur={handleDateChange}
          placeholder="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          onBlur={handleDateChange}
          placeholder="To date"
        />
      </div>

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.onlyActive}
          onChange={(e) => dispatch(setOnlyActive(e.target.checked))}
        />
        Active cases only
      </label>

      <button onClick={() => dispatch(clearFilters())}>Clear Filters</button>
    </div>
  );
};
