'use client'

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useSettings } from '@/components/providers/SettingsProvider'
import { FilamentPageHeader } from './components/list/FilamentPageHeader'
import { FilamentStatsCards } from './components/list/FilamentStatsCards'
import { FilamentFilters } from './components/list/FilamentFilters'
import { FilamentTypeCard } from './components/list/FilamentTypeCard'
import { FilamentEmptyState } from './components/list/FilamentEmptyState'
import { FilamentLoadingState } from './components/list/FilamentLoadingState'
import { CreateSpoolDialog } from './components/CreateSpoolDialog'
import { useFilament } from './hooks/useFilament'

export default function FilamentPage() {
  const { data: session } = useSession()
  const { settings } = useSettings()

  const {
    filaments,
    types,
    colors,
    isLoading,
    isFilamentDialogOpen,
    setIsFilamentDialogOpen,
    isSpoolDialogOpen,
    setIsSpoolDialogOpen,
    selectedFilament,
    setSelectedFilament,
    expandedFilaments,
    searchTerm,
    setSearchTerm,
    filterType,
    setFilterType,
    lowStockOnly,
    setLowStockOnly,
    brandSearch,
    setBrandSearch,
    showBrandSuggestions,
    setShowBrandSuggestions,
    filamentForm,
    setFilamentForm,
    spoolsToAdd,
    brandSuggestions,
    filteredFilaments,
    totalSpools,
    totalRemainingWeight,
    lowStockFilaments,
    resetFilamentForm,
    resetSpoolsForm,
    handleCreateFilament,
    handleAddSpools,
    handleDeleteSpool,
    handleDeleteFilament,
    handleBrandSelect,
    addSpoolRow,
    removeSpoolRow,
    updateSpoolRow,
    toggleExpanded,
  } = useFilament()

  const canEdit = session?.user?.role !== 'VIEWER'

  // Types filtered by selected technology for the create material form
  const typesForForm = useMemo(
    () => types.filter((t) => t.technology === filamentForm.technology),
    [types, filamentForm.technology]
  )

  if (isLoading) {
    return <FilamentLoadingState />
  }

  return (
    <div className="space-y-6">
      <FilamentPageHeader
        canEdit={canEdit}
        isDialogOpen={isFilamentDialogOpen}
        onOpenChange={setIsFilamentDialogOpen}
        filamentForm={filamentForm}
        onFilamentFormChange={setFilamentForm}
        brandSearch={brandSearch}
        onBrandSearchChange={setBrandSearch}
        showBrandSuggestions={showBrandSuggestions}
        onShowBrandSuggestionsChange={setShowBrandSuggestions}
        brandSuggestions={brandSuggestions}
        onBrandSelect={handleBrandSelect}
        types={typesForForm}
        filteredColors={colors}
        onSubmit={handleCreateFilament}
        onReset={resetFilamentForm}
      />

      <FilamentStatsCards
        filamentCount={filaments.length}
        totalSpools={totalSpools}
        totalRemainingWeight={totalRemainingWeight}
        lowStockFilaments={lowStockFilaments}
      />

      <FilamentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        lowStockOnly={lowStockOnly}
        onLowStockOnlyChange={setLowStockOnly}
        types={types}
      />

      <div className="space-y-4">
        {filteredFilaments.map((filament) => (
          <FilamentTypeCard
            key={filament.id}
            filament={filament}
            isExpanded={expandedFilaments.has(filament.id)}
            currency={settings.currency}
            canEdit={canEdit}
            onToggleExpanded={toggleExpanded}
            onAddSpools={(f) => {
              setSelectedFilament(f)
              setIsSpoolDialogOpen(true)
            }}
            onDeleteFilament={handleDeleteFilament}
            onDeleteSpool={handleDeleteSpool}
          />
        ))}

        {filteredFilaments.length === 0 && (
          <FilamentEmptyState hasFilaments={filaments.length > 0} />
        )}
      </div>

      <CreateSpoolDialog
        open={isSpoolDialogOpen}
        onOpenChange={(open) => {
          setIsSpoolDialogOpen(open)
          if (!open) resetSpoolsForm()
        }}
        selectedFilament={selectedFilament}
        spoolsToAdd={spoolsToAdd}
        onAddSpoolRow={addSpoolRow}
        onRemoveSpoolRow={removeSpoolRow}
        onUpdateSpoolRow={updateSpoolRow}
        onSubmit={handleAddSpools}
        onCancel={() => {
          setIsSpoolDialogOpen(false)
          resetSpoolsForm()
        }}
      />
    </div>
  )
}