package com.expensetracker.service;

import com.expensetracker.entity.*;
import com.expensetracker.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository repo;

    public TransactionService(TransactionRepository repo) {
        this.repo = repo;
    }

    public Transaction save(Transaction t) {
        return repo.save(t);
    }

    public List<Transaction> all() {
        return repo.findAll();
    }

    public BigDecimal total(TransactionType type) {
        return repo.findByType(type)
                   .stream()
                   .map(Transaction::getAmount)
                   .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
