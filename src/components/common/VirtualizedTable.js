import React, { useRef, useEffect } from 'react';
import { Table, Form, Badge, Dropdown, Spinner } from 'react-bootstrap';
import { useVirtualScrolling } from '../../hooks/useVirtualScrolling';

const VirtualizedTable = ({
  data = [],
  columns = [],
  rowHeight = 60,
  containerHeight = 400,
  onRowSelect,
  selectedRows = new Set(),
  onSelectAll,
  loading = false,
  actionLoading = {},
  onAction
}) => {
  const containerRef = useRef(null);
  
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualScrolling({
    items: data,
    itemHeight: rowHeight,
    containerHeight,
    overscan: 3
  });
  
  // Auto-scroll to top when data changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [data.length]);
  
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = item[column.key];
    
    if (column.type === 'badge') {
      return (
        <Badge bg={column.getBadgeVariant ? column.getBadgeVariant(value) : 'secondary'}>
          {value}
        </Badge>
      );
    }
    
    if (column.type === 'date') {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (column.type === 'number') {
      return typeof value === 'number' ? value.toFixed(2) : '0.00';
    }
    
    return value || '';
  };
  
  const renderActionDropdown = (item) => {
    const actions = columns.find(col => col.key === 'actions')?.actions || [];
    
    return (
      <Dropdown>
        <Dropdown.Toggle 
          variant="outline-secondary" 
          size="sm"
          disabled={actionLoading[item.id]}
        >
          {actionLoading[item.id] ? (
            <Spinner animation="border" size="sm" />
          ) : (
            'Actions'
          )}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {actions.map((action, index) => (
            <React.Fragment key={action.key}>
              {action.divider && index > 0 && <Dropdown.Divider />}
              <Dropdown.Item 
                onClick={() => onAction(action.key, item)}
                disabled={actionLoading[`${item.id}_${action.key}`]}
                className={action.variant === 'danger' ? 'text-danger' : ''}
              >
                {actionLoading[`${item.id}_${action.key}`] ? 
                  `${action.loadingText || 'Loading'}...` : 
                  action.label
                }
              </Dropdown.Item>
            </React.Fragment>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    );
  };
  
  if (loading && data.length === 0) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted">No data available</p>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef}
      style={{ 
        height: containerHeight, 
        overflow: 'auto',
        border: '1px solid #dee2e6',
        borderRadius: '0.375rem'
      }}
      onScroll={handleScroll}
    >
      <Table responsive hover className="mb-0">
        <thead className="table-light sticky-top">
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ width: column.width }}>
                {column.key === 'select' ? (
                  <Form.Check
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={onSelectAll}
                  />
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Spacer for items before visible range */}
          {offsetY > 0 && (
            <tr>
              <td 
                colSpan={columns.length} 
                style={{ height: offsetY, padding: 0, border: 'none' }}
              />
            </tr>
          )}
          
          {/* Visible items */}
          {visibleItems.map((item) => (
            <tr key={item.id} style={{ height: rowHeight }}>
              {columns.map((column) => (
                <td key={column.key} style={{ width: column.width }}>
                  {column.key === 'select' ? (
                    <Form.Check
                      type="checkbox"
                      checked={selectedRows.has(item.id)}
                      onChange={() => onRowSelect(item.id)}
                    />
                  ) : column.key === 'actions' ? (
                    renderActionDropdown(item)
                  ) : (
                    renderCell(item, column)
                  )}
                </td>
              ))}
            </tr>
          ))}
          
          {/* Spacer for items after visible range */}
          {totalHeight - offsetY - (visibleItems.length * rowHeight) > 0 && (
            <tr>
              <td 
                colSpan={columns.length} 
                style={{ 
                  height: totalHeight - offsetY - (visibleItems.length * rowHeight), 
                  padding: 0, 
                  border: 'none' 
                }}
              />
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default VirtualizedTable;