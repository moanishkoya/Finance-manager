package com.expensetracker.controller;

import com.expensetracker.entity.*;
import com.expensetracker.service.TransactionService;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin("*")
public class TransactionController {

    private final TransactionService service;

    public TransactionController(TransactionService service) {
        this.service = service;
    }

    @PostMapping
    public Transaction add(@RequestBody Transaction t) {
        return service.save(t);
    }

    @GetMapping
    public List<Transaction> all() {
        return service.all();
    }

    @GetMapping("/summary")
    public Map<String, BigDecimal> summary() {
        BigDecimal income = service.total(TransactionType.INCOME);
        BigDecimal expense = service.total(TransactionType.EXPENSE);

        Map<String, BigDecimal> m = new HashMap<>();
        m.put("totalIncome", income);
        m.put("totalExpense", expense);
        m.put("netBalance", income.subtract(expense));
        return m;
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
