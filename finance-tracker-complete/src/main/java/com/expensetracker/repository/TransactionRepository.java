
package com.expensetracker.repository;
import com.expensetracker.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction,Long>{
 List<Transaction> findByType(TransactionType type);
}
